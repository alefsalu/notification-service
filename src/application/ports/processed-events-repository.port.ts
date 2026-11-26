import { ClientSession } from 'mongoose';

export interface ProcessedEventsRepositoryPort {
  recordEventIfNotExists(eventId: string, eventType: string, session?: ClientSession): Promise<boolean>;
  hasEventBeenProcessed(eventId: string): Promise<boolean>;
}

export const ProcessedEventsRepositoryPort = Symbol('ProcessedEventsRepositoryPort');
