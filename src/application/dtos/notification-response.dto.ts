import { NotificationChannel } from '../../domain/enums/notification-channel.enum.js';
import { NotificationStatus } from '../../domain/enums/notification-status.enum.js';
import { Notification } from '../../domain/entities/notification.entity.js';

export interface NotificationResponseDto {
  id: string;
  userId: string;
  channel: NotificationChannel;
  recipient: string;
  templateKey: string;
  data: Record<string, unknown>;
  status: NotificationStatus;
  correlationId: string;
  sentAt?: string;
  failedAt?: string;
  failureReason?: string;
  attempts: number;
  createdAt: string;
}

export function toNotificationResponseDto(entity: Notification): NotificationResponseDto {
  return {
    id: entity.id,
    userId: entity.userId,
    channel: entity.channel,
    recipient: entity.recipient,
    templateKey: entity.templateKey,
    data: entity.data,
    status: entity.status,
    correlationId: entity.correlationId,
    sentAt: entity.sentAt?.toISOString(),
    failedAt: entity.failedAt?.toISOString(),
    failureReason: entity.failureReason,
    attempts: entity.attempts,
    createdAt: entity.createdAt.toISOString(),
  };
}
