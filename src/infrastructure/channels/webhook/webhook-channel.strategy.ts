import crypto from 'node:crypto';
import axios from 'axios';
import { ChannelStrategyPort, ChannelDeliveryResult } from '../../../application/ports/channel-strategy.port.js';
import { Notification } from '../../../domain/entities/notification.entity.js';
import { NotificationChannel } from '../../../domain/enums/notification-channel.enum.js';

export class WebhookChannelStrategy implements ChannelStrategyPort {
  readonly channel = NotificationChannel.WEBHOOK;
  private readonly secret: string;

  constructor(secret?: string) {
    this.secret = secret ?? process.env.WEBHOOK_SECRET ?? 'default-webhook-secret';
  }

  async send(notification: Notification, subject: string, body: string): Promise<ChannelDeliveryResult> {
    try {
      const signature = crypto.createHmac('sha256', this.secret).update(body).digest('hex');

      const response = await axios.post(notification.recipient, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Signature-SHA256': signature,
          'X-Correlation-Id': notification.correlationId,
          'X-Subject': subject,
        },
        timeout: 5000,
      });

      return {
        success: response.status >= 200 && response.status < 300,
        externalMessageId: `webhook-${Date.now()}`,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
