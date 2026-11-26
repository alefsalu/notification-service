import { ClientSession } from 'mongoose';
import { OutboxRepositoryPort, OutboxEntry } from '../../application/ports/outbox-repository.port.js';
import { OutboxModel, OutboxDocument } from './schemas/outbox.schema.js';

export class MongoOutboxRepository implements OutboxRepositoryPort {
  async save(entry: OutboxEntry, session?: ClientSession): Promise<void> {
    await OutboxModel.findByIdAndUpdate(
      entry.id,
      {
        $set: {
          eventType: entry.eventType,
          aggregateType: entry.aggregateType,
          aggregateId: entry.aggregateId,
          payload: entry.payload,
          correlationId: entry.correlationId,
          occurredAt: entry.occurredAt,
          publishedAt: entry.publishedAt ?? null,
          attempts: entry.attempts,
        },
        $setOnInsert: {
          _id: entry.id,
        },
      },
      { upsert: true, new: true, session },
    );
  }

  async findUnpublished(limit = 100): Promise<OutboxEntry[]> {
    const docs = await OutboxModel.find({ publishedAt: null })
      .sort({ occurredAt: 1 })
      .limit(limit)
      .exec();

    return docs.map((doc) => this.toEntry(doc));
  }

  async markAsPublished(id: string): Promise<void> {
    await OutboxModel.findByIdAndUpdate(id, {
      $set: { publishedAt: new Date() },
    }).exec();
  }

  async incrementAttempts(id: string): Promise<void> {
    await OutboxModel.findByIdAndUpdate(id, {
      $inc: { attempts: 1 },
    }).exec();
  }

  private toEntry(doc: OutboxDocument): OutboxEntry {
    return {
      id: doc._id,
      eventType: doc.eventType,
      aggregateType: doc.aggregateType,
      aggregateId: doc.aggregateId,
      payload: doc.payload,
      correlationId: doc.correlationId,
      occurredAt: doc.occurredAt,
      publishedAt: doc.publishedAt,
      attempts: doc.attempts,
    };
  }
}
