import Token from './models/Token';
import Table from './models/Table';
import Settings from './models/Settings';
import OverrideLog from './models/OverrideLog';
import Analytics from './models/Analytics';
import connectDB from './db';

const AVG_SEAT_TIME_MINUTES = 45;

/**
 * Generate next token number
 */
export async function generateTokenNumber(): Promise<string> {
    await connectDB();

    const lastToken = await Token.findOne().sort({ createdAt: -1 }).select('tokenNumber');

    if (!lastToken) {
        return 'T001';
    }

    const lastNumber = parseInt(lastToken.tokenNumber.substring(1));
    const nextNumber = lastNumber + 1;

    return `T${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Calculate estimated wait time based on queue position
 */
export async function calculateEstimatedWaitTime(queuePosition: number): Promise<number> {
    await connectDB();

    const settings = await Settings.findOne();
    const avgSeatTime = settings?.avgSeatTimeMinutes || AVG_SEAT_TIME_MINUTES;

    return queuePosition * avgSeatTime;
}

/**
 * Get next queue position
 */
export async function getNextQueuePosition(): Promise<number> {
    await connectDB();

    const maxPosition = await Token.findOne({ status: 'waiting' })
        .sort({ queuePosition: -1 })
        .select('queuePosition');

    return maxPosition ? maxPosition.queuePosition + 1 : 1;
}

/**
 * Recalculate queue positions after changes
 */
export async function recalculateQueuePositions(): Promise<void> {
    await connectDB();

    const waitingTokens = await Token.find({ status: 'waiting' }).sort({ queuePosition: 1, createdAt: 1 });

    for (let i = 0; i < waitingTokens.length; i++) {
        waitingTokens[i].queuePosition = i + 1;
        waitingTokens[i].estimatedWaitTime = await calculateEstimatedWaitTime(i + 1);
        await waitingTokens[i].save();
    }
}

/**
 * Find best table match for party size
 */
export async function findBestTableMatch(partySize: number, shareConsent: boolean = false): Promise<any> {
    await connectDB();

    // First, try to find exact match or smallest table that fits
    const freeTables = await Table.find({ status: 'free' }).sort({ capacity: 1 });

    // Exact match
    const exactMatch = freeTables.find(table => table.capacity === partySize);
    if (exactMatch) {
        return { tables: [exactMatch], type: 'exact' };
    }

    // Smallest table that fits
    const smallestFit = freeTables.find(table => table.capacity >= partySize);
    if (smallestFit) {
        return { tables: [smallestFit], type: 'single' };
    }

    // Try joining tables
    const joinableTables = freeTables.filter(table => table.isJoinable);
    for (let i = 0; i < joinableTables.length; i++) {
        for (let j = i + 1; j < joinableTables.length; j++) {
            const combinedCapacity = joinableTables[i].capacity + joinableTables[j].capacity;
            if (combinedCapacity >= partySize) {
                return { tables: [joinableTables[i], joinableTables[j]], type: 'joined' };
            }
        }
    }

    // Try shared seating if consent given
    if (shareConsent) {
        const sharedTables = await Table.find({ status: 'shared' });
        for (const table of sharedTables) {
            // Get current occupancy
            const currentToken = await Token.findById(table.currentToken);
            if (currentToken) {
                const availableCapacity = table.capacity - currentToken.partySize;
                if (availableCapacity >= partySize) {
                    return { tables: [table], type: 'shared' };
                }
            }
        }
    }

    return null;
}

/**
 * Assign table to token
 */
export async function assignTableToToken(
    tokenId: string,
    tableIds: string[],
    assignmentType: 'exact' | 'single' | 'joined' | 'shared',
    performedBy?: string
): Promise<void> {
    await connectDB();

    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    const tables = await Table.find({ _id: { $in: tableIds } });
    if (tables.length === 0) throw new Error('Tables not found');

    // Update token
    token.status = 'seated';
    token.seatedTime = new Date();
    token.assignedTable = tables[0]._id;
    await token.save();

    // Update tables
    for (const table of tables) {
        if (assignmentType === 'shared') {
            table.status = 'shared';
        } else {
            table.status = 'occupied';
        }
        table.currentToken = token._id;
        await table.save();
    }

    // Recalculate queue
    await recalculateQueuePositions();

    // Log the assignment
    if (performedBy) {
        await OverrideLog.create({
            action: 'manual_assign',
            performedBy,
            tokenId: token._id,
            tableId: tables[0]._id,
            reason: `Manually assigned ${assignmentType} table(s)`,
            timestamp: new Date(),
        });
    }
}

/**
 * Auto-assign tables to waiting tokens
 */
export async function autoAssignTables(): Promise<number> {
    await connectDB();

    const waitingTokens = await Token.find({ status: 'waiting' }).sort({ queuePosition: 1 });
    let assignedCount = 0;

    for (const token of waitingTokens) {
        const match = await findBestTableMatch(token.partySize, token.shareConsent);

        if (match) {
            await assignTableToToken(
                token._id.toString(),
                match.tables.map((t: any) => t._id.toString()),
                match.type
            );
            assignedCount++;
        }
    }

    return assignedCount;
}

/**
 * Check for reservation timeouts
 */
export async function checkReservationTimeouts(): Promise<number> {
    await connectDB();

    const settings = await Settings.findOne();
    const gracePeriod = settings?.gracePeriodMinutes || 15;

    const cutoffTime = new Date(Date.now() - gracePeriod * 60 * 1000);

    const lateTokens = await Token.find({
        type: 'reservation',
        status: 'waiting',
        reservationTime: { $lt: cutoffTime },
    });

    let timeoutCount = 0;

    for (const token of lateTokens) {
        token.status = 'cancelled';
        await token.save();

        // Log timeout
        await OverrideLog.create({
            action: 'auto_timeout',
            performedBy: 'system',
            tokenId: token._id,
            reason: `Reservation timeout after ${gracePeriod} minutes grace period`,
            timestamp: new Date(),
        });

        timeoutCount++;
    }

    if (timeoutCount > 0) {
        await recalculateQueuePositions();
    }

    return timeoutCount;
}

/**
 * Complete token and free table
 */
export async function completeToken(tokenId: string, performedBy?: string): Promise<void> {
    await connectDB();

    const token = await Token.findById(tokenId);
    if (!token) throw new Error('Token not found');

    token.status = 'completed';
    await token.save();

    // Free the table
    if (token.assignedTable) {
        const table = await Table.findById(token.assignedTable);
        if (table) {
            table.status = 'free';
            table.currentToken = undefined;
            await table.save();
        }
    }

    // Log completion
    if (performedBy) {
        await OverrideLog.create({
            action: 'complete_token',
            performedBy,
            tokenId: token._id,
            tableId: token.assignedTable,
            reason: 'Token completed',
            timestamp: new Date(),
        });
    }
}

/**
 * Update analytics for current hour
 */
export async function updateAnalytics(): Promise<void> {
    await connectDB();

    const now = new Date();
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();

    // Count tokens created in this hour
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    const tokenCount = await Token.countDocuments({
        createdAt: { $gte: hourStart, $lt: hourEnd },
    });

    const shareConsentCount = await Token.countDocuments({
        createdAt: { $gte: hourStart, $lt: hourEnd },
        shareConsent: true,
    });

    // Calculate average wait time
    const completedTokens = await Token.find({
        createdAt: { $gte: hourStart, $lt: hourEnd },
        status: 'completed',
        seatedTime: { $exists: true },
    });

    let avgWaitTime = 0;
    if (completedTokens.length > 0) {
        const totalWaitTime = completedTokens.reduce((sum, token) => {
            const wait = token.seatedTime!.getTime() - token.arrivalTime.getTime();
            return sum + wait / (1000 * 60); // Convert to minutes
        }, 0);
        avgWaitTime = totalWaitTime / completedTokens.length;
    }

    // Update or create analytics record
    await Analytics.findOneAndUpdate(
        { date: dateOnly, hour: currentHour },
        {
            $set: {
                tokenCount,
                shareConsentCount,
                avgWaitTime,
            },
        },
        { upsert: true, new: true }
    );

    // Calculate peak hours (tokens > average)
    const todayAnalytics = await Analytics.find({ date: dateOnly });
    if (todayAnalytics.length > 0) {
        const avgTokens = todayAnalytics.reduce((sum, a) => sum + a.tokenCount, 0) / todayAnalytics.length;

        for (const analytics of todayAnalytics) {
            analytics.peakHour = analytics.tokenCount > avgTokens;
            await analytics.save();
        }
    }
}
