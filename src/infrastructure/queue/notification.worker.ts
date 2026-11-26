import { Worker, Job } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { NotificationRepositoryPort } from '../../application/ports/notification-repository.port.js';
import { TemplateRepositoryPort } from '../../application/ports/template-repository.port.js';
import { TemplateEngine } from '../../domain/services/template-engine.js';
import { ChannelStrategyRegistry } from '../channels/channel-strategy.registry.js';
import { OutboxRepositoryPort } from '../../application/ports/outbox-repository.port.js';
import { NotificationJob } from './notification-job.interface.js';
import { NotificationStatus } from '../../domain/enums/notification-status.enum.js';

export class NotificationWorker {
  private worker?: Worker;

  constructor(
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly templateRepository: TemplateRepositoryPort,
    private readonly templateEngine: TemplateEngine,
    private readonly strategyRegistry: ChannelStrategyRegistry,
    private readonly outboxRepository?: OutboxRepositoryPort,
    redisConnection?: { host: string; port: number },
  ) {
    if (redisConnection) {
      this.initWorker(redisConnection);
    }
  }

  initWorker(connection: { host: string; port: number }): void {
    this.worker = new Worker<NotificationJob>(
      'notification-dispatch',
      async (job: Job<NotificationJob>) => {
        await this.processJob(job);
      },
      { connection, concurrency: 5 },
    );
  }

  async processJob(job: Job<NotificationJob>): Promise<void> {
    const { notificationId } = job.data;
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      return;
    }

    if (
      notification.status === NotificationStatus.SENT ||
      notification.status === NotificationStatus.FAILED
    ) {
      return;
    }

    try {
      const template = await this.templateRepository.findByKey(notification.templateKey);
      if (!template) {
        throw new Error(`Template not found: ${notification.templateKey}`);
      }

      const rendered = this.templateEngine.render(template, notification.data);
      const strategy = this.strategyRegistry.get(notification.channel);
      const result = await strategy.send(notification, rendered.subject, rendered.body);

      if (!result.success) {
        throw new Error(result.error ?? 'Channel delivery reported failure');
      }

      notification.markAsSent();
      await this.notificationRepository.save(notification);

      if (this.outboxRepository) {
        await this.outboxRepository.save({
          id: randomUUID(),
          eventType: 'notifications.notification.sent.v1',
          aggregateType: 'Notification',
          aggregateId: notification.id,
          correlationId: notification.correlationId,
          occurredAt: new Date(),
          attempts: 0,
          payload: {
            notificationId: notification.id,
            userId: notification.userId,
            channel: notification.channel,
            sentAt: notification.sentAt?.toISOString(),
          },
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const maxAttempts = job.opts?.attempts ?? 3;
      const currentAttempt = (job.attemptsMade ?? 0) + 1;

      if (currentAttempt >= maxAttempts) {
        notification.markAsFailed(errorMsg, currentAttempt);
        await this.notificationRepository.save(notification);

        if (this.outboxRepository) {
          await this.outboxRepository.save({
            id: randomUUID(),
            eventType: 'notifications.notification.failed.v1',
            aggregateType: 'Notification',
            aggregateId: notification.id,
            correlationId: notification.correlationId,
            occurredAt: new Date(),
            attempts: 0,
            payload: {
              notificationId: notification.id,
              userId: notification.userId,
              channel: notification.channel,
              reason: errorMsg,
              attempts: currentAttempt,
              failedAt: notification.failedAt?.toISOString(),
            },
          });
        }
      }

      throw err;
    }
  }

  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
