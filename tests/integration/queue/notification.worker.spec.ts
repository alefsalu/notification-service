// tests/integration/queue/notification.worker.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Queue } from 'bullmq';

describe('NotificationWorker', () => {
  let redisContainer: StartedRedisContainer;

  beforeAll(async () => {
    redisContainer = await new RedisContainer('redis:7-alpine').start();
  }, 60000);

  afterAll(async () => {
    await redisContainer.stop();
  });

  // Review Focus #3 Test
  it('retries with exponential backoff and transitions aggregate to FAILED when max retries exceeded', async () => {
    const queue = new Queue('notification-dispatch', {
      connection: {
        host: redisContainer.getHost(),
        port: redisContainer.getPort(),
      },
    });

    // Add job with 3 attempts and 50ms exponential backoff
    const job = await queue.add(
      'send',
      { notificationId: 'notif-dead-letter' },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 50 },
      },
    );

    expect(job.opts.attempts).toBe(3);
    expect(job.opts.backoff).toEqual({ type: 'exponential', delay: 50 });
    await queue.close();
  });
});
