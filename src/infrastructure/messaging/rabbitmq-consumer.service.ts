import amqp, { ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import { ProcessedEventsRepositoryPort } from '../../application/ports/processed-events-repository.port.js';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case.js';
import { NotificationRequestedEnvelope } from './dtos/notification-requested-event.dto.js';

export class RabbitmqConsumerService {
  private connection?: ChannelModel;
  private channel?: Channel;
  private readonly exchange = 'notifications.events';
  private readonly queue = 'notifications.requested';
  private readonly routingKey = 'notifications.notification.requested.v1';

  constructor(
    private readonly processedEventsRepository: ProcessedEventsRepositoryPort,
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly amqpUrl?: string,
  ) {}

  async start(): Promise<void> {
    const url = this.amqpUrl ?? process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5674';
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
    await this.channel.assertQueue(this.queue, { durable: true });
    await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

    await this.channel.prefetch(10);
    await this.channel.consume(this.queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString('utf-8')) as NotificationRequestedEnvelope;
        await this.handleMessage(content);
        this.channel?.ack(msg);
      } catch (err: unknown) {
        // In production, reject or dead-letter based on error type
        this.channel?.nack(msg, false, false);
      }
    });
  }

  async handleMessage(event: NotificationRequestedEnvelope): Promise<void> {
    const isNew = await this.processedEventsRepository.recordEventIfNotExists(
      event.eventId,
      event.eventType,
    );

    if (!isNew) {
      // Duplicate event detected by deduplication store; ignore idempotently
      return;
    }

    await this.sendNotificationUseCase.execute({
      userId: event.payload.userId,
      channel: event.payload.channel,
      recipient: event.payload.recipient,
      templateKey: event.payload.templateKey,
      data: event.payload.data,
      correlationId: event.correlationId,
    });
  }

  async stop(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
