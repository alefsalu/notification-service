import mongoose, { Schema, Document, Model } from 'mongoose';
import { NotificationChannel } from '../../../../domain/enums/notification-channel.enum.js';
import { QuietHoursProps } from '../../../../domain/value-objects/quiet-hours.vo.js';

export interface UserPreferencesDocument extends Document<string> {
  _id: string; // userId
  userId: string;
  enabledChannels: Record<NotificationChannel, boolean>;
  quietHours: QuietHoursProps;
  createdAt: Date;
  updatedAt: Date;
}

export const UserPreferencesSchema = new Schema<UserPreferencesDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    enabledChannels: {
      type: Map,
      of: Boolean,
      default: {
        [NotificationChannel.EMAIL]: true,
        [NotificationChannel.WEBHOOK]: true,
        [NotificationChannel.IN_APP]: true,
      },
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '22:00' },
      endTime: { type: String, default: '07:00' },
      timezone: { type: String, default: 'UTC' },
    },
  },
  {
    timestamps: true,
    _id: false,
    collection: 'user_preferences',
  },
);

export const UserPreferencesModel: Model<UserPreferencesDocument> =
  (mongoose.models.UserPreferences as Model<UserPreferencesDocument>) ||
  mongoose.model<UserPreferencesDocument>('UserPreferences', UserPreferencesSchema);
