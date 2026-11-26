export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly occurredAt: Date;
  readonly correlationId: string;
  readonly payload: Record<string, unknown>;
}
