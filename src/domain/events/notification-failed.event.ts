import { randomUUID } from 'node:crypto';
import { DomainEvent } from './domain-event.interface.js';

export class NotificationFailedEvent implements DomainEvent {
  readonly eventId: string;
  readonly eventType = 'notifications.notification.failed.v1';
  readonly aggregateType = 'Notification';
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly correlationId: string;
  readonly payload: Record<string, unknown>;

  constructor(
    notificationId: string,
    correlationId: string,
    reason: string,
    attempts: number,
    payload: Record<string, unknown>,
  ) {
    this.eventId = randomUUID();
    this.aggregateId = notificationId;
    this.occurredAt = new Date();
    this.correlationId = correlationId;
    this.payload = {
      ...payload,
      reason,
      attempts,
    };
  }
}
