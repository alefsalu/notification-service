// tests/integration/messaging/rabbitmq-consumer.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { RabbitmqConsumerService } from '../../../src/infrastructure/messaging/rabbitmq-consumer.service.js';
import { ProcessedEventsRepositoryPort } from '../../../src/application/ports/processed-events-repository.port.js';
import { SendNotificationUseCase } from '../../../src/application/use-cases/send-notification.use-case.js';
import { NotificationChannel } from '../../../src/domain/enums/notification-channel.enum.js';
import { NotificationRequestedEnvelope } from '../../../src/infrastructure/messaging/dtos/notification-requested-event.dto.js';

describe('RabbitmqConsumerService', () => {
  // Review Focus #4 Test
  it('ingests event on first delivery and deduplicates redundant eventId on redelivery', async () => {
    const recordedEvents = new Set<string>();
    const processedEventsMock: ProcessedEventsRepositoryPort = {
      recordEventIfNotExists: vi.fn().mockImplementation((eventId: string) => {
        if (recordedEvents.has(eventId)) return Promise.resolve(false);
        recordedEvents.add(eventId);
        return Promise.resolve(true);
      }),
      hasEventBeenProcessed: vi.fn().mockImplementation((eventId: string) => {
        return Promise.resolve(recordedEvents.has(eventId));
      }),
    };

    const sendUseCaseMock = {
      execute: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    } as unknown as SendNotificationUseCase;

    const consumer = new RabbitmqConsumerService(processedEventsMock, sendUseCaseMock);

    const messagePayload: NotificationRequestedEnvelope = {
      eventId: 'dedup-uuid-999',
      eventType: 'notifications.notification.requested.v1',
      occurredAt: '2026-11-25T20:00:00Z',
      correlationId: 'corr-dedup',
      payload: {
        userId: 'u-1',
        channel: NotificationChannel.EMAIL,
        recipient: 'u1@example.com',
        templateKey: 'welcome',
        data: { name: 'Bob' },
      },
    };

    // First arrival
    await consumer.handleMessage(messagePayload);
    expect(sendUseCaseMock.execute).toHaveBeenCalledTimes(1);

    // Second arrival (redelivery)
    await consumer.handleMessage(messagePayload);
    expect(sendUseCaseMock.execute).toHaveBeenCalledTimes(1); // Dedup ignored duplicate
  });
});
