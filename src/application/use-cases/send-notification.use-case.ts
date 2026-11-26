import { randomUUID } from 'node:crypto';
import { NotificationRepositoryPort } from '../ports/notification-repository.port.js';
import { NotificationQueuePort } from '../ports/notification-queue.port.js';
import { UserPreferencesRepositoryPort } from '../ports/user-preferences-repository.port.js';
import { UserPreferencesPolicy } from '../../domain/services/user-preferences-policy.js';
import { Notification } from '../../domain/entities/notification.entity.js';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum.js';
import { SendNotificationCommand } from '../dtos/send-notification.command.js';
import { NotificationResponseDto, toNotificationResponseDto } from '../dtos/notification-response.dto.js';

export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly notificationQueue: NotificationQueuePort,
    private readonly preferencesRepository: UserPreferencesRepositoryPort,
    private readonly preferencesPolicy: UserPreferencesPolicy,
  ) {}

  async execute(command: SendNotificationCommand): Promise<NotificationResponseDto> {
    const correlationId = command.correlationId ?? randomUUID();
    let recipient = command.recipient;
    if (!recipient && command.channel === NotificationChannel.IN_APP) {
      recipient = command.userId;
    }

    if (!recipient) {
      throw new Error(`Recipient is required for channel ${command.channel}`);
    }

    const prefs = await this.preferencesRepository.findByUserId(command.userId);
    if (prefs && !this.preferencesPolicy.canReceive(prefs, command.channel, new Date())) {
      const rejectedNotif = Notification.create({
        id: command.id,
        userId: command.userId,
        channel: command.channel,
        recipient,
        templateKey: command.templateKey,
        data: command.data,
        correlationId,
      });

      rejectedNotif.markAsFailed('USER_OPTED_OUT_OR_QUIET_HOURS', 0);
      await this.notificationRepository.save(rejectedNotif);
      return toNotificationResponseDto(rejectedNotif);
    }

    const notification = Notification.create({
      id: command.id,
      userId: command.userId,
      channel: command.channel,
      recipient,
      templateKey: command.templateKey,
      data: command.data,
      correlationId,
    });

    await this.notificationRepository.save(notification);

    await this.notificationQueue.enqueue({
      notificationId: notification.id,
    });

    notification.markAsQueued();
    await this.notificationRepository.save(notification);

    return toNotificationResponseDto(notification);
  }
}
