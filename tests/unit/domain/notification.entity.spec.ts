// tests/unit/domain/notification.entity.spec.ts
import { describe, it, expect } from 'vitest';
import { Notification } from '../../../src/domain/entities/notification.entity.js';
import { NotificationChannel } from '../../../src/domain/enums/notification-channel.enum.js';
import { NotificationStatus } from '../../../src/domain/enums/notification-status.enum.js';

describe('Notification Aggregate', () => {
  it('creates notification in PENDING status and transitions to QUEUED, SENT, and FAILED', () => {
    const notification = Notification.create({
      userId: 'c6b986e3-c23f-4e0a-bdf9-0db7cfad1e32',
      channel: NotificationChannel.EMAIL,
      recipient: 'user@example.com',
      templateKey: 'transfer.completed',
      data: { amount: '100.00' },
      correlationId: 'corr-123',
    });

    expect(notification.status).toBe(NotificationStatus.PENDING);
    expect(notification.pullDomainEvents()).toHaveLength(1);

    notification.markAsQueued();
    expect(notification.status).toBe(NotificationStatus.QUEUED);

    notification.markAsSent();
    expect(notification.status).toBe(NotificationStatus.SENT);
    expect(notification.sentAt).toBeInstanceOf(Date);

    expect(() => notification.markAsQueued()).toThrowError(/Invalid state transition/);
  });

  it('transitions to FAILED status with error details', () => {
    const notification = Notification.create({
      userId: 'c6b986e3-c23f-4e0a-bdf9-0db7cfad1e32',
      channel: NotificationChannel.WEBHOOK,
      recipient: 'https://example.com/hook',
      templateKey: 'order.placed',
      data: { orderId: 'ord-1' },
      correlationId: 'corr-456',
    });

    notification.markAsQueued();
    notification.markAsFailed('HTTP 500 Internal Server Error', 3);

    expect(notification.status).toBe(NotificationStatus.FAILED);
    expect(notification.failureReason).toBe('HTTP 500 Internal Server Error');
    expect(notification.attempts).toBe(3);
    expect(notification.failedAt).toBeInstanceOf(Date);
  });
});
