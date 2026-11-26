import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ProcessedEventDocument extends Document<string> {
  _id: string; // eventId
  eventId: string;
  eventType: string;
  processedAt: Date;
}

export const ProcessedEventSchema = new Schema<ProcessedEventDocument>(
  {
    _id: { type: String, required: true },
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  {
    _id: false,
    collection: 'processed_events',
  },
);

export const ProcessedEventModel: Model<ProcessedEventDocument> =
  (mongoose.models.ProcessedEvent as Model<ProcessedEventDocument>) ||
  mongoose.model<ProcessedEventDocument>('ProcessedEvent', ProcessedEventSchema);
