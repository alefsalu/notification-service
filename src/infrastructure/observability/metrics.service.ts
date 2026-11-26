import { Injectable } from '@nestjs/common';
import client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: client.Registry;
  readonly notificationsSentTotal: client.Counter<string>;
  readonly notificationsFailedTotal: client.Counter<string>;

  constructor() {
    this.registry = new client.Registry();
    client.collectDefaultMetrics({ register: this.registry });

    this.notificationsSentTotal = new client.Counter({
      name: 'notifications_sent_total',
      help: 'Total number of successfully sent notifications',
      labelNames: ['channel'],
      registers: [this.registry],
    });

    this.notificationsFailedTotal = new client.Counter({
      name: 'notifications_failed_total',
      help: 'Total number of failed notifications',
      labelNames: ['channel', 'reason'],
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
