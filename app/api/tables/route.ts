import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Table from '@/lib/models/Table';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { emitTableUpdated } from '@/lib/socket';

export async function GET() {
    try {
        await connectDB();

        const tables = await Table.find()
            .sort({ tableNumber: 1 })
            .populate('currentToken');

        return NextResponse.json({ tables });
    } catch (error: any) {
        console.error('Get tables error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tables' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const user = await getAuthUser();
        if (!user || !isAdmin(user)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { tableNumber, capacity, isJoinable } = body;

        // Validation
        if (!tableNumber || !capacity) {
            return NextResponse.json(
                { error: 'Table number and capacity are required' },
                { status: 400 }
            );
        }

        if (capacity < 1) {
            return NextResponse.json(
                { error: 'Capacity must be at least 1' },
                { status: 400 }
            );
        }

        // Check if table number already exists
        const existingTable = await Table.findOne({ tableNumber });
        if (existingTable) {
            return NextResponse.json(
                { error: 'Table number already exists' },
                { status: 400 }
            );
        }

        // Create table
        const table = await Table.create({
            tableNumber,
            capacity,
            isJoinable: isJoinable !== undefined ? isJoinable : true,
            status: 'free',
        });

        // Emit socket event
        emitTableUpdated(table._id.toString());

        return NextResponse.json({ success: true, table }, { status: 201 });
    } catch (error: any) {
        console.error('Create table error:', error);
        return NextResponse.json(
            { error: 'Failed to create table' },
            { status: 500 }
        );
    }
}
