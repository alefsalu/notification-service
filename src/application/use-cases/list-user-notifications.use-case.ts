import {
  NotificationRepositoryPort,
  PaginatedResult,
} from '../ports/notification-repository.port.js';
import { NotificationResponseDto, toNotificationResponseDto } from '../dtos/notification-response.dto.js';

export class ListUserNotificationsUseCase {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {}

  async execute(
    userId: string,
    page = 0,
    size = 20,
  ): Promise<PaginatedResult<NotificationResponseDto>> {
    const validPage = Math.max(0, page);
    const validSize = Math.min(Math.max(1, size), 100);

    const result = await this.notificationRepository.findByUserId(userId, validPage, validSize);

    return {
      content: result.content.map((n) => toNotificationResponseDto(n)),
      page: result.page,
      size: result.size,
      totalElements: result.totalElements,
      totalPages: result.totalPages,
    };
  }
}
