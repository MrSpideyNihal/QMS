import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
    gracePeriodMinutes: number;
    autoRefresh: boolean;
    operatingHours: {
        open: string;
        close: string;
    };
    avgSeatTimeMinutes: number;
    createdAt: Date;
    updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
    {
        gracePeriodMinutes: {
            type: Number,
            default: 15,
            min: 0,
        },
        autoRefresh: {
            type: Boolean,
            default: true,
        },
        operatingHours: {
            open: {
                type: String,
                default: '09:00',
            },
            close: {
                type: String,
                default: '22:00',
            },
        },
        avgSeatTimeMinutes: {
            type: Number,
            default: 45,
            min: 1,
        },
    },
    {
        timestamps: true,
    }
);

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
