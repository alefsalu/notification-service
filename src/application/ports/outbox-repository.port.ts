import { ClientSession } from 'mongoose';

export interface OutboxEntry {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  occurredAt: Date;
  publishedAt?: Date | null;
  attempts: number;
}

export interface OutboxRepositoryPort {
  save(entry: OutboxEntry, session?: ClientSession): Promise<void>;
  findUnpublished(limit?: number): Promise<OutboxEntry[]>;
  markAsPublished(id: string): Promise<void>;
  incrementAttempts(id: string): Promise<void>;
}

export const OutboxRepositoryPort = Symbol('OutboxRepositoryPort');
