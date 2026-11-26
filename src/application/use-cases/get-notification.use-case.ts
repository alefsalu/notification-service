import { NotificationRepositoryPort } from '../ports/notification-repository.port.js';
import { NotificationResponseDto, toNotificationResponseDto } from '../dtos/notification-response.dto.js';

export class GetNotificationUseCase {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {}

  async execute(
    id: string,
    requesterUserId?: string,
    requesterRoles: string[] = [],
  ): Promise<NotificationResponseDto | null> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      return null;
    }

    const isAdmin = requesterRoles.includes('ADMIN');
    if (!isAdmin && requesterUserId && notification.userId !== requesterUserId) {
      throw new Error('FORBIDDEN: You cannot view notifications for other users');
    }

    return toNotificationResponseDto(notification);
  }
}
