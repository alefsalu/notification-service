import { ClientSession } from 'mongoose';
import { ProcessedEventsRepositoryPort } from '../../../../application/ports/processed-events-repository.port.js';
import { ProcessedEventModel } from '../schemas/processed-event.schema.js';

export class MongoProcessedEventsRepository implements ProcessedEventsRepositoryPort {
  async recordEventIfNotExists(
    eventId: string,
    eventType: string,
    session?: ClientSession,
  ): Promise<boolean> {
    try {
      await ProcessedEventModel.create(
        [
          {
            _id: eventId,
            eventId,
            eventType,
            processedAt: new Date(),
          },
        ],
        { session },
      );
      return true;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
        return false;
      }
      throw err;
    }
  }

  async hasEventBeenProcessed(eventId: string): Promise<boolean> {
    const doc = await ProcessedEventModel.findById(eventId).exec();
    return doc !== null;
  }
}
