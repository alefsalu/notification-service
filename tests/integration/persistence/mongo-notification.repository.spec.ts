// tests/integration/persistence/mongo-notification.repository.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import mongoose from 'mongoose';
import { MongoNotificationRepository } from '../../../src/infrastructure/persistence/mongodb/repositories/mongo-notification.repository.js';
import { Notification } from '../../../src/domain/entities/notification.entity.js';
import { NotificationChannel } from '../../../src/domain/enums/notification-channel.enum.js';
import { NotificationStatus } from '../../../src/domain/enums/notification-status.enum.js';

describe('MongoNotificationRepository', () => {
  let container: StartedMongoDBContainer;
  let repository: MongoNotificationRepository;

  beforeAll(async () => {
    container = await new MongoDBContainer('mongo:7.0').start();
    await mongoose.connect(container.getConnectionString(), { directConnection: true });
    repository = new MongoNotificationRepository();
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    await container.stop();
  });

  it('saves and retrieves notification by id and paginated userId', async () => {
    const notification = Notification.create({
      userId: '60056de0-4117-403e-9b14-1b1dea1ad2ff',
      channel: NotificationChannel.EMAIL,
      recipient: 'test@example.com',
      templateKey: 'welcome',
      data: { name: 'User' },
      correlationId: 'c-1',
    });

    await repository.save(notification);
    const retrieved = await repository.findById(notification.id);
    expect(retrieved?.id).toBe(notification.id);
    expect(retrieved?.status).toBe(NotificationStatus.PENDING);

    const page = await repository.findByUserId('60056de0-4117-403e-9b14-1b1dea1ad2ff', 0, 10);
    expect(page.content).toHaveLength(1);
    expect(page.totalElements).toBe(1);
  });
});
