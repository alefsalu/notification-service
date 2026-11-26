import mongoose, { Schema, Document, Model } from 'mongoose';
import { NotificationChannel } from '../../../../domain/enums/notification-channel.enum.js';

export interface TemplateDocument extends Document<string> {
  _id: string; // template key
  key: string;
  channel: NotificationChannel;
  subject: string;
  bodyTemplate: string;
  createdAt: Date;
  updatedAt: Date;
}

export const TemplateSchema = new Schema<TemplateDocument>(
  {
    _id: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    channel: { type: String, enum: Object.values(NotificationChannel), required: true },
    subject: { type: String, required: true },
    bodyTemplate: { type: String, required: true },
  },
  {
    timestamps: true,
    _id: false,
    collection: 'templates',
  },
);

export const TemplateModel: Model<TemplateDocument> =
  (mongoose.models.Template as Model<TemplateDocument>) ||
  mongoose.model<TemplateDocument>('Template', TemplateSchema);
