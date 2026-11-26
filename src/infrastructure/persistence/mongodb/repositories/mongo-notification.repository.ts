import { ClientSession } from 'mongoose';
import {
  NotificationRepositoryPort,
  PaginatedResult,
} from '../../../../application/ports/notification-repository.port.js';
import { Notification } from '../../../../domain/entities/notification.entity.js';
import { NotificationModel } from '../schemas/notification.schema.js';
import { NotificationMapper } from '../mappers/notification.mapper.js';

export class MongoNotificationRepository implements NotificationRepositoryPort {
  async save(notification: Notification, session?: ClientSession): Promise<void> {
    const data = NotificationMapper.toPersistence(notification);
    await NotificationModel.findByIdAndUpdate(
      notification.id,
      {
        $set: data,
        $setOnInsert: { createdAt: notification.createdAt },
      },
      { upsert: true, new: true, session },
    );
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await NotificationModel.findById(id).exec();
    if (!doc) return null;
    return NotificationMapper.toDomain(doc);
  }

  async findByUserId(userId: string, page: number, size: number): Promise<PaginatedResult<Notification>> {
    const filter = { userId };
    const [docs, totalElements] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(page * size)
        .limit(size)
        .exec(),
      NotificationModel.countDocuments(filter).exec(),
    ]);

    const content = docs.map((doc) => NotificationMapper.toDomain(doc));
    const totalPages = Math.ceil(totalElements / size);

    return {
      content,
      page,
      size,
      totalElements,
      totalPages,
    };
  }
}
