// tests/integration/outbox/outbox-relay.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { OutboxRelayService } from '../../../src/infrastructure/outbox/outbox-relay.service.js';
import { OutboxRepositoryPort } from '../../../src/application/ports/outbox-repository.port.js';
import { EventPublisherPort } from '../../../src/application/ports/event-publisher.port.js';

describe('OutboxRelayService', () => {
  it('publishes unpublished entries with publisher confirms and updates published_at', async () => {
    const outboxMock: OutboxRepositoryPort = {
      findUnpublished: vi.fn().mockResolvedValue([
        {
          id: 'out-1',
          eventType: 'notifications.notification.sent.v1',
          aggregateType: 'Notification',
          aggregateId: 'n-1',
          payload: { notificationId: 'n-1' },
          correlationId: 'c-1',
          occurredAt: new Date('2026-11-25T20:00:00Z'),
          attempts: 0,
        },
      ]),
      markAsPublished: vi.fn().mockResolvedValue(undefined),
      incrementAttempts: vi.fn().mockResolvedValue(undefined),
      save: vi.fn(),
    };

    const publisherMock: EventPublisherPort = {
      publish: vi.fn().mockResolvedValue(true),
    };

    const relay = new OutboxRelayService(outboxMock, publisherMock);
    const count = await relay.publishPendingBatch();

    expect(count).toBe(1);
    expect(publisherMock.publish).toHaveBeenCalledWith(
      'notifications.notification.sent.v1',
      expect.objectContaining({ correlationId: 'c-1' }),
    );
    expect(outboxMock.markAsPublished).toHaveBeenCalledWith('out-1');
  });
});
