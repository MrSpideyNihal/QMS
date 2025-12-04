import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Table from '@/lib/models/Table';
import { getAuthUser, isAdmin } from '@/lib/auth';
import { emitTableUpdated } from '@/lib/socket';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const table = await Table.findById(params.id).populate('currentToken');

        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }

        return NextResponse.json({ table });
    } catch (error: any) {
        console.error('Get table error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch table' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const table = await Table.findById(params.id);

        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }

        // Update allowed fields
        const allowedFields = ['capacity', 'status', 'isJoinable'];

        // Only admins can change capacity and isJoinable
        if ((body.capacity !== undefined || body.isJoinable !== undefined) && !isAdmin(user)) {
            return NextResponse.json(
                { error: 'Admin access required to modify table properties' },
                { status: 403 }
            );
        }

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                (table as any)[field] = body[field];
            }
        }

        await table.save();

        emitTableUpdated(table._id.toString());

        return NextResponse.json({ success: true, table });
    } catch (error: any) {
        console.error('Update table error:', error);
        return NextResponse.json(
            { error: 'Failed to update table' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();

        const user = await getAuthUser();
        if (!user || !isAdmin(user)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        const table = await Table.findById(params.id);

        if (!table) {
            return NextResponse.json({ error: 'Table not found' }, { status: 404 });
        }

        // Don't allow deletion if table is occupied
        if (table.status === 'occupied' || table.status === 'shared') {
            return NextResponse.json(
                { error: 'Cannot delete occupied table' },
                { status: 400 }
            );
        }

        await Table.findByIdAndDelete(params.id);

        emitTableUpdated(params.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete table error:', error);
        return NextResponse.json(
            { error: 'Failed to delete table' },
            { status: 500 }
        );
    }
}
