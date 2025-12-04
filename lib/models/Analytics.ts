import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalytics extends Document {
    date: Date;
    hour: number;
    tokenCount: number;
    peakHour: boolean;
    avgWaitTime?: number;
    shareConsentCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
    {
        date: {
            type: Date,
            required: true,
            index: true,
        },
        hour: {
            type: Number,
            required: true,
            min: 0,
            max: 23,
            index: true,
        },
        tokenCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        peakHour: {
            type: Boolean,
            default: false,
        },
        avgWaitTime: {
            type: Number,
            default: 0,
        },
        shareConsentCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Create compound indexes for performance
AnalyticsSchema.index({ date: 1, hour: 1 }, { unique: true });
AnalyticsSchema.index({ date: -1 });

const Analytics: Model<IAnalytics> = mongoose.models.Analytics || mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);

export default Analytics;
