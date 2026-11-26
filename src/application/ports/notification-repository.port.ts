import { ClientSession } from 'mongoose';
import { Notification } from '../../domain/entities/notification.entity.js';

export interface PaginatedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface NotificationRepositoryPort {
  save(notification: Notification, session?: ClientSession): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, page: number, size: number): Promise<PaginatedResult<Notification>>;
}

export const NotificationRepositoryPort = Symbol('NotificationRepositoryPort');
