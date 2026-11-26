import { NotificationJob } from '../../infrastructure/queue/notification-job.interface.js';

export interface NotificationQueuePort {
  enqueue(job: NotificationJob): Promise<string>;
}

export const NotificationQueuePort = Symbol('NotificationQueuePort');
