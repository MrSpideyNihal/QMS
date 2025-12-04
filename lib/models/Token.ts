import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IToken extends Document {
    tokenNumber: string;
    customerName: string;
    phoneNumber: string;
    partySize: number;
    type: 'walkin' | 'reservation';
    status: 'waiting' | 'seated' | 'cancelled' | 'completed';
    reservationTime?: Date;
    arrivalTime: Date;
    seatedTime?: Date;
    estimatedWaitTime: number;
    queuePosition: number;
    assignedTable?: mongoose.Types.ObjectId;
    shareConsent: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TokenSchema = new Schema<IToken>(
    {
        tokenNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },
        partySize: {
            type: Number,
            required: true,
            min: 1,
        },
        type: {
            type: String,
            enum: ['walkin', 'reservation'],
            required: true,
            default: 'walkin',
        },
        status: {
            type: String,
            enum: ['waiting', 'seated', 'cancelled', 'completed'],
            default: 'waiting',
            index: true,
        },
        reservationTime: {
            type: Date,
            default: null,
        },
        arrivalTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        seatedTime: {
            type: Date,
            default: null,
        },
        estimatedWaitTime: {
            type: Number,
            default: 0,
        },
        queuePosition: {
            type: Number,
            default: 0,
            index: true,
        },
        assignedTable: {
            type: Schema.Types.ObjectId,
            ref: 'Table',
            default: null,
        },
        shareConsent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Create compound indexes for performance
TokenSchema.index({ status: 1, queuePosition: 1 });
TokenSchema.index({ status: 1, type: 1 });
TokenSchema.index({ createdAt: -1 });

const Token: Model<IToken> = mongoose.models.Token || mongoose.model<IToken>('Token', TokenSchema);

export default Token;
