import { NotificationChannel } from '../../domain/enums/notification-channel.enum.js';

export interface SendNotificationCommand {
  id?: string;
  userId: string;
  channel: NotificationChannel;
  recipient?: string;
  templateKey: string;
  data: Record<string, unknown>;
  correlationId?: string;
}
