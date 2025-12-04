import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOverrideLog extends Document {
    action: string;
    performedBy: string;
    tokenId?: mongoose.Types.ObjectId;
    tableId?: mongoose.Types.ObjectId;
    reason: string;
    timestamp: Date;
    metadata?: any;
}

const OverrideLogSchema = new Schema<IOverrideLog>(
    {
        action: {
            type: String,
            required: true,
            index: true,
        },
        performedBy: {
            type: String,
            required: true,
        },
        tokenId: {
            type: Schema.Types.ObjectId,
            ref: 'Token',
            default: null,
        },
        tableId: {
            type: Schema.Types.ObjectId,
            ref: 'Table',
            default: null,
        },
        reason: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: false,
    }
);

// Create indexes for performance
OverrideLogSchema.index({ timestamp: -1 });
OverrideLogSchema.index({ action: 1, timestamp: -1 });

const OverrideLog: Model<IOverrideLog> = mongoose.models.OverrideLog || mongoose.model<IOverrideLog>('OverrideLog', OverrideLogSchema);

export default OverrideLog;
