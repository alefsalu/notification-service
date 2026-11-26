// tests/unit/channels/webhook-channel.strategy.spec.ts
import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { WebhookChannelStrategy } from '../../../src/infrastructure/channels/webhook/webhook-channel.strategy.js';
import { Notification } from '../../../src/domain/entities/notification.entity.js';
import { NotificationChannel } from '../../../src/domain/enums/notification-channel.enum.js';

vi.mock('axios');

describe('WebhookChannelStrategy', () => {
  it('delivers POST with HMAC-SHA256 signature in X-Signature-SHA256 header', async () => {
    const strategy = new WebhookChannelStrategy('secret-key');
    const mockedPost = vi.mocked(axios.post).mockResolvedValueOnce({ status: 200, data: { ok: true } });

    const notification = Notification.create({
      userId: 'u-1',
      channel: NotificationChannel.WEBHOOK,
      recipient: 'https://example.com/webhook',
      templateKey: 'order.placed',
      data: { orderId: 'ord-1' },
      correlationId: 'corr-1',
    });

    const result = await strategy.send(notification, 'Order Placed', '{"orderId":"ord-1"}');
    expect(result.success).toBe(true);
    expect(mockedPost).toHaveBeenCalledWith(
      'https://example.com/webhook',
      '{"orderId":"ord-1"}',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Signature-SHA256': expect.any(String),
          'Content-Type': 'application/json',
          'X-Correlation-Id': 'corr-1',
        }),
        timeout: 5000,
      }),
    );
  });

  it('captures error message when HTTP POST fails', async () => {
    const strategy = new WebhookChannelStrategy('secret-key');
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network error'));

    const notification = Notification.create({
      userId: 'u-2',
      channel: NotificationChannel.WEBHOOK,
      recipient: 'https://example.com/failing-webhook',
      templateKey: 'order.placed',
      data: {},
      correlationId: 'corr-2',
    });

    const result = await strategy.send(notification, 'Order Placed', '{}');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });
});
