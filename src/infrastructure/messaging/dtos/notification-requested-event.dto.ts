import { NotificationChannel } from '../../../domain/enums/notification-channel.enum.js';

export interface NotificationRequestedPayload {
  userId: string;
  channel: NotificationChannel;
  templateKey: string;
  recipient?: string;
  data: Record<string, unknown>;
}

export interface NotificationRequestedEnvelope {
  eventId: string;
  eventType: string;
  occurredAt: string;
  correlationId: string;
  payload: NotificationRequestedPayload;
}
