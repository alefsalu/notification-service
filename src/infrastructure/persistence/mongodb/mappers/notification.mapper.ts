import { Notification } from '../../../../domain/entities/notification.entity.js';
import { NotificationDocument } from '../schemas/notification.schema.js';

export class NotificationMapper {
  static toDomain(doc: NotificationDocument): Notification {
    return Notification.reconstitute({
      id: doc._id,
      userId: doc.userId,
      channel: doc.channel,
      recipient: doc.recipient,
      templateKey: doc.templateKey,
      data: doc.data ?? {},
      correlationId: doc.correlationId,
      status: doc.status,
      sentAt: doc.sentAt,
      failedAt: doc.failedAt,
      failureReason: doc.failureReason,
      attempts: doc.attempts ?? 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toPersistence(entity: Notification): Partial<NotificationDocument> {
    return {
      _id: entity.id,
      userId: entity.userId,
      channel: entity.channel,
      recipient: entity.recipient,
      templateKey: entity.templateKey,
      data: entity.data,
      correlationId: entity.correlationId,
      status: entity.status,
      sentAt: entity.sentAt,
      failedAt: entity.failedAt,
      failureReason: entity.failureReason,
      attempts: entity.attempts,
      updatedAt: entity.updatedAt,
    };
  }
}
