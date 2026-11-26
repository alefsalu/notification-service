import { ChannelStrategyPort, ChannelDeliveryResult } from '../../../application/ports/channel-strategy.port.js';
import { WebsocketBroadcasterPort } from '../../../application/ports/websocket-broadcaster.port.js';
import { Notification } from '../../../domain/entities/notification.entity.js';
import { NotificationChannel } from '../../../domain/enums/notification-channel.enum.js';

export class InAppChannelStrategy implements ChannelStrategyPort {
  readonly channel = NotificationChannel.IN_APP;

  constructor(private readonly broadcaster: WebsocketBroadcasterPort) {}

  async send(notification: Notification, subject: string, body: string): Promise<ChannelDeliveryResult> {
    try {
      const delivered = await this.broadcaster.sendToUser(notification.userId, 'notification', {
        id: notification.id,
        channel: notification.channel,
        subject,
        body,
        data: notification.data,
        correlationId: notification.correlationId,
        createdAt: notification.createdAt,
      });

      return {
        success: delivered,
        externalMessageId: `inapp-${notification.id}`,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}
