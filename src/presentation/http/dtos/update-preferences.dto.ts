import { IsBoolean, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel } from '../../../domain/enums/notification-channel.enum.js';

export class QuietHoursDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsString()
  timezone!: string;
}

export class UpdatePreferencesDto {
  @IsObject()
  @IsOptional()
  enabledChannels?: Partial<Record<NotificationChannel, boolean>>;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto;
}
