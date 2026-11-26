import { OutboxRepositoryPort } from '../../application/ports/outbox-repository.port.js';
import { EventPublisherPort, EventEnvelope } from '../../application/ports/event-publisher.port.js';

export class OutboxRelayService {
  private timer?: NodeJS.Timeout;
  private isProcessing = false;

  constructor(
    private readonly outboxRepository: OutboxRepositoryPort,
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  start(intervalMs = 1000): void {
    this.timer = setInterval(async () => {
      await this.publishPendingBatch();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async publishPendingBatch(limit = 100): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;

    let publishedCount = 0;
    try {
      const entries = await this.outboxRepository.findUnpublished(limit);

      for (const entry of entries) {
        const envelope: EventEnvelope = {
          eventId: entry.id,
          eventType: entry.eventType,
          occurredAt: entry.occurredAt.toISOString(),
          aggregateType: entry.aggregateType,
          aggregateId: entry.aggregateId,
          correlationId: entry.correlationId,
          payload: entry.payload,
        };

        try {
          const success = await this.eventPublisher.publish(entry.eventType, envelope);
          if (success) {
            await this.outboxRepository.markAsPublished(entry.id);
            publishedCount++;
          } else {
            await this.outboxRepository.incrementAttempts(entry.id);
          }
        } catch {
          await this.outboxRepository.incrementAttempts(entry.id);
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return publishedCount;
  }
}
