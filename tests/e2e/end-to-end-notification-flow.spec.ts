// tests/e2e/end-to-end-notification-flow.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { SendNotificationUseCase } from '../../src/application/use-cases/send-notification.use-case.js';
import { TemplateEngine } from '../../src/domain/services/template-engine.js';
import { UserPreferencesPolicy } from '../../src/domain/services/user-preferences-policy.js';
import { NotificationChannel } from '../../src/domain/enums/notification-channel.enum.js';
import { NotificationStatus } from '../../src/domain/enums/notification-status.enum.js';
import { Template } from '../../src/domain/entities/template.entity.js';
import { Notification } from '../../src/domain/entities/notification.entity.js';
import { ChannelStrategyRegistry } from '../../src/infrastructure/channels/channel-strategy.registry.js';
import { NotificationWorker } from '../../src/infrastructure/queue/notification.worker.js';
import { OutboxRelayService } from '../../src/infrastructure/outbox/outbox-relay.service.js';
import { RabbitmqConsumerService } from '../../src/infrastructure/messaging/rabbitmq-consumer.service.js';
import { OutboxEntry, OutboxRepositoryPort } from '../../src/application/ports/outbox-repository.port.js';
import { NotificationRepositoryPort } from '../../src/application/ports/notification-repository.port.js';
import { TemplateRepositoryPort } from '../../src/application/ports/template-repository.port.js';
import { UserPreferencesRepositoryPort } from '../../src/application/ports/user-preferences-repository.port.js';
import { ProcessedEventsRepositoryPort } from '../../src/application/ports/processed-events-repository.port.js';
import { NotificationQueuePort } from '../../src/application/ports/notification-queue.port.js';
import { EventPublisherPort, EventEnvelope } from '../../src/application/ports/event-publisher.port.js';

describe('End-to-End Notification Flow', () => {
  it('processes requested event through consumer, queue, delivery strategy, aggregate state change, and outbox relay', async () => {
    // 1. In-memory state stores
    const notifications = new Map<string, Notification>();
    const templates = new Map<string, Template>();
    const processedEvents = new Set<string>();
    const outboxEntries = new Map<string, OutboxEntry>();
    const publishedEvents: { routingKey: string; envelope: EventEnvelope }[] = [];
    const queuedJobs: { notificationId: string }[] = [];

    // Seed template
    const welcomeTemplate = Template.create({
      key: 'user.welcome',
      channel: NotificationChannel.EMAIL,
      subject: 'Welcome, {{name}}!',
      bodyTemplate: 'Hi {{name}}, your account at {{platform}} is active.',
    });
    templates.set(welcomeTemplate.key, welcomeTemplate);

    // Mock Repositories & Ports
    const notificationRepo: NotificationRepositoryPort = {
      save: vi.fn().mockImplementation(async (n: Notification) => {
        notifications.set(n.id, n);
      }),
      findById: vi.fn().mockImplementation(async (id: string) => notifications.get(id) ?? null),
      findByUserId: vi.fn(),
    };

    const templateRepo: TemplateRepositoryPort = {
      save: vi.fn(),
      findByKey: vi.fn().mockImplementation(async (key: string) => templates.get(key) ?? null),
      findAll: vi.fn().mockResolvedValue(Array.from(templates.values())),
    };

    const prefsRepo: UserPreferencesRepositoryPort = {
      save: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue(null), // default open
    };

    const processedEventsRepo: ProcessedEventsRepositoryPort = {
      recordEventIfNotExists: vi.fn().mockImplementation(async (eventId: string) => {
        if (processedEvents.has(eventId)) return false;
        processedEvents.add(eventId);
        return true;
      }),
      hasEventBeenProcessed: vi.fn().mockImplementation(async (id: string) => processedEvents.has(id)),
    };

    const outboxRepo: OutboxRepositoryPort = {
      save: vi.fn().mockImplementation(async (entry: OutboxEntry) => {
        outboxEntries.set(entry.id, entry);
      }),
      findUnpublished: vi.fn().mockImplementation(async () => {
        return Array.from(outboxEntries.values()).filter((e) => !e.publishedAt);
      }),
      markAsPublished: vi.fn().mockImplementation(async (id: string) => {
        const entry = outboxEntries.get(id);
        if (entry) entry.publishedAt = new Date();
      }),
      incrementAttempts: vi.fn().mockImplementation(async (id: string) => {
        const entry = outboxEntries.get(id);
        if (entry) entry.attempts++;
      }),
    };

    const queuePort: NotificationQueuePort = {
      enqueue: vi.fn().mockImplementation(async (job: { notificationId: string }) => {
        queuedJobs.push(job);
        return 'job-1';
      }),
    };

    const publisherPort: EventPublisherPort = {
      publish: vi.fn().mockImplementation(async (routingKey: string, envelope: EventEnvelope) => {
        publishedEvents.push({ routingKey, envelope });
        return true;
      }),
    };

    // Strategies
    const mockEmailStrategy = {
      channel: NotificationChannel.EMAIL,
      send: vi.fn().mockResolvedValue({ success: true, externalMessageId: 'email-123' }),
    };
    const strategyRegistry = new ChannelStrategyRegistry([mockEmailStrategy]);
    const templateEngine = new TemplateEngine();
    const policy = new UserPreferencesPolicy();

    // Use cases and workers
    const sendUseCase = new SendNotificationUseCase(notificationRepo, queuePort, prefsRepo, policy);
    const consumer = new RabbitmqConsumerService(processedEventsRepo, sendUseCase);
    const worker = new NotificationWorker(
      notificationRepo,
      templateRepo,
      templateEngine,
      strategyRegistry,
      outboxRepo,
    );
    const relay = new OutboxRelayService(outboxRepo, publisherPort);

    // Step A: Ingest event from RabbitMQ
    const incomingEvent = {
      eventId: 'evt-welcome-001',
      eventType: 'notifications.notification.requested.v1',
      occurredAt: new Date().toISOString(),
      correlationId: 'corr-flow-999',
      payload: {
        userId: 'u-flow-1',
        channel: NotificationChannel.EMAIL,
        recipient: 'alice@example.com',
        templateKey: 'user.welcome',
        data: { name: 'Alice', platform: 'Portfolio' },
      },
    };

    await consumer.handleMessage(incomingEvent);

    // Assert: Notification created and queued
    expect(notifications.size).toBe(1);
    const createdNotif = Array.from(notifications.values())[0];
    expect(createdNotif.status).toBe(NotificationStatus.QUEUED);
    expect(queuedJobs).toHaveLength(1);

    // Step B: Worker processes job from queue
    const queuedJob = queuedJobs[0];
    await worker.processJob({
      data: queuedJob,
      opts: { attempts: 3 },
      attemptsMade: 0,
    } as any);

    // Assert: Aggregate updated to SENT and Outbox entry created
    expect(createdNotif.status).toBe(NotificationStatus.SENT);
    expect(createdNotif.sentAt).toBeInstanceOf(Date);
    expect(mockEmailStrategy.send).toHaveBeenCalledWith(
      createdNotif,
      'Welcome, Alice!',
      'Hi Alice, your account at Portfolio is active.',
    );
    expect(outboxEntries.size).toBe(1);
    const outboxEntry = Array.from(outboxEntries.values())[0];
    expect(outboxEntry.eventType).toBe('notifications.notification.sent.v1');
    expect(outboxEntry.publishedAt).toBeFalsy();

    // Step C: Outbox relay executes scheduled publication
    const publishedCount = await relay.publishPendingBatch();
    expect(publishedCount).toBe(1);
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].routingKey).toBe('notifications.notification.sent.v1');
    expect(publishedEvents[0].envelope.correlationId).toBe('corr-flow-999');
    expect(outboxEntry.publishedAt).toBeInstanceOf(Date);
  });
});
