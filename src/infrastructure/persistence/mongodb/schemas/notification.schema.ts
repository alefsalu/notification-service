import mongoose, { Schema, Document, Model } from 'mongoose';
import { NotificationChannel } from '../../../../domain/enums/notification-channel.enum.js';
import { NotificationStatus } from '../../../../domain/enums/notification-status.enum.js';

export interface NotificationDocument extends Document<string> {
  _id: string;
  userId: string;
  channel: NotificationChannel;
  recipient: string;
  templateKey: string;
  data: Record<string, unknown>;
  correlationId: string;
  status: NotificationStatus;
  sentAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = new Schema<NotificationDocument>(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    recipient: { type: String, required: true },
    templateKey: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    correlationId: { type: String, required: true },
    status: { type: String, enum: Object.values(NotificationStatus), required: true, index: true },
    sentAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
    attempts: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    _id: false,
    collection: 'notifications',
  },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel: Model<NotificationDocument> =
  (mongoose.models.Notification as Model<NotificationDocument>) ||
  mongoose.model<NotificationDocument>('Notification', NotificationSchema);
