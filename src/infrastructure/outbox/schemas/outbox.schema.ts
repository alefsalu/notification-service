import mongoose, { Schema, Document, Model } from 'mongoose';

export interface OutboxDocument extends Document<string> {
  _id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  occurredAt: Date;
  publishedAt?: Date | null;
  attempts: number;
}

export const OutboxSchema = new Schema<OutboxDocument>(
  {
    _id: { type: String, required: true },
    eventType: { type: String, required: true },
    aggregateType: { type: String, required: true },
    aggregateId: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    correlationId: { type: String, required: true },
    occurredAt: { type: Date, required: true },
    publishedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  {
    _id: false,
    collection: 'outbox',
  },
);

OutboxSchema.index({ publishedAt: 1, attempts: 1, occurredAt: 1 });

export const OutboxModel: Model<OutboxDocument> =
  (mongoose.models.Outbox as Model<OutboxDocument>) ||
  mongoose.model<OutboxDocument>('Outbox', OutboxSchema);
