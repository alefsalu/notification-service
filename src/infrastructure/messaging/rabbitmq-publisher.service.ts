import amqp, { ChannelModel, ConfirmChannel } from 'amqplib';
import { EventPublisherPort, EventEnvelope } from '../../application/ports/event-publisher.port.js';

export class RabbitmqPublisherService implements EventPublisherPort {
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private readonly exchange = 'notifications.events';

  constructor(private readonly amqpUrl?: string) {}

  async connect(): Promise<void> {
    const url = this.amqpUrl ?? process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5674';
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createConfirmChannel();
    await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
  }

  async publish(routingKey: string, envelope: EventEnvelope): Promise<boolean> {
    if (!this.channel) {
      await this.connect();
    }

    const content = Buffer.from(JSON.stringify(envelope));
    return new Promise<boolean>((resolve, reject) => {
      this.channel!.publish(
        this.exchange,
        routingKey,
        content,
        {
          persistent: true,
          contentType: 'application/json',
          headers: {
            'X-Correlation-Id': envelope.correlationId,
          },
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        },
      );
    });
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
