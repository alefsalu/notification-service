import { Notification } from '../../domain/entities/notification.entity.js';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum.js';

export interface ChannelDeliveryResult {
  success: boolean;
  externalMessageId?: string;
  error?: string;
}

export interface ChannelStrategyPort {
  readonly channel: NotificationChannel;
  send(notification: Notification, subject: string, body: string): Promise<ChannelDeliveryResult>;
}

export const ChannelStrategyPort = Symbol('ChannelStrategyPort');
