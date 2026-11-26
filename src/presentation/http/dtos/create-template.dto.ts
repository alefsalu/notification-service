import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { NotificationChannel } from '../../../domain/enums/notification-channel.enum.js';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel!: NotificationChannel;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  bodyTemplate!: string;
}

export class UpdateTemplateDto {
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  bodyTemplate!: string;
}
