import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { NotificationChannel } from '../../../domain/enums/notification-channel.enum.js';

export class CreateNotificationDto {
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel!: NotificationChannel;

  @IsString()
  @IsOptional()
  recipient?: string;

  @IsString()
  @IsNotEmpty()
  templateKey!: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  userId?: string;
}
