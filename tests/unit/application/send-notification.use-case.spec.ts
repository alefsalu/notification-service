// tests/unit/application/send-notification.use-case.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { SendNotificationUseCase } from '../../../src/application/use-cases/send-notification.use-case.js';
import { NotificationRepositoryPort } from '../../../src/application/ports/notification-repository.port.js';
import { NotificationQueuePort } from '../../../src/application/ports/notification-queue.port.js';
import { UserPreferencesRepositoryPort } from '../../../src/application/ports/user-preferences-repository.port.js';
import { UserPreferencesPolicy } from '../../../src/domain/services/user-preferences-policy.js';
import { NotificationChannel } from '../../../src/domain/enums/notification-channel.enum.js';
import { NotificationStatus } from '../../../src/domain/enums/notification-status.enum.js';

describe('SendNotificationUseCase', () => {
  it('checks user preferences, saves aggregate in QUEUED status, and dispatches to queue', async () => {
    const notifRepo: NotificationRepositoryPort = {
      save: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
    };
    const queue: NotificationQueuePort = {
      enqueue: vi.fn().mockResolvedValue('job-1'),
    };
    const prefsRepo: UserPreferencesRepositoryPort = {
      findByUserId: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
    };
    const policy = new UserPreferencesPolicy();

    const useCase = new SendNotificationUseCase(notifRepo, queue, prefsRepo, policy);
    const result = await useCase.execute({
      userId: 'user-1',
      channel: NotificationChannel.EMAIL,
      recipient: 'user@example.com',
      templateKey: 'welcome',
      data: { name: 'User' },
      correlationId: 'corr-1',
    });

    expect(result.status).toBe(NotificationStatus.QUEUED);
    expect(queue.enqueue).toHaveBeenCalledTimes(1);
    expect(notifRepo.save).toHaveBeenCalledTimes(2); // PENDING then QUEUED
  });
});
