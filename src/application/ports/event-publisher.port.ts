export interface EventEnvelope {
  eventId: string;
  eventType: string;
  occurredAt: string;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export interface EventPublisherPort {
  publish(routingKey: string, envelope: EventEnvelope): Promise<boolean>;
}

export const EventPublisherPort = Symbol('EventPublisherPort');
