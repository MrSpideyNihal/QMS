import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITable extends Document {
    tableNumber: number;
    capacity: number;
    status: 'free' | 'occupied' | 'reserved' | 'shared';
    currentToken?: mongoose.Types.ObjectId;
    isJoinable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TableSchema = new Schema<ITable>(
    {
        tableNumber: {
            type: Number,
            required: true,
            unique: true,
        },
        capacity: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            enum: ['free', 'occupied', 'reserved', 'shared'],
            default: 'free',
            index: true,
        },
        currentToken: {
            type: Schema.Types.ObjectId,
            ref: 'Token',
            default: null,
        },
        isJoinable: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Create indexes for performance
TableSchema.index({ status: 1, capacity: 1 });
TableSchema.index({ tableNumber: 1 });

const Table: Model<ITable> = mongoose.models.Table || mongoose.model<ITable>('Table', TableSchema);

export default Table;
