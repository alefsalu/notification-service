import { Queue } from 'bullmq';
import { NotificationQueuePort } from '../../application/ports/notification-queue.port.js';
import { NotificationJob } from './notification-job.interface.js';

export class BullmqQueueService implements NotificationQueuePort {
  private readonly queue: Queue;

  constructor(queue?: Queue) {
    if (queue) {
      this.queue = queue;
    } else {
      const host = process.env.REDIS_HOST ?? 'localhost';
      const port = parseInt(process.env.REDIS_PORT ?? '6380', 10);
      this.queue = new Queue('notification-dispatch', {
        connection: { host, port },
      });
    }
  }

  async enqueue(job: NotificationJob): Promise<string> {
    const bullJob = await this.queue.add('send', job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    return bullJob.id ?? job.notificationId;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
