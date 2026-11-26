import { NotificationChannel } from '../enums/notification-channel.enum.js';
import { QuietHours, QuietHoursProps } from '../value-objects/quiet-hours.vo.js';

export interface CreateUserPreferencesProps {
  userId: string;
  enabledChannels?: Partial<Record<NotificationChannel, boolean>>;
  quietHours?: QuietHoursProps;
}

export interface ReconstituteUserPreferencesProps {
  userId: string;
  enabledChannels: Record<NotificationChannel, boolean>;
  quietHours: QuietHoursProps;
  createdAt: Date;
  updatedAt: Date;
}

export class UserPreferences {
  private readonly _userId: string;
  private _enabledChannels: Record<NotificationChannel, boolean>;
  private _quietHours: QuietHours;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    userId: string,
    enabledChannels: Record<NotificationChannel, boolean>,
    quietHours: QuietHours,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this._userId = userId;
    this._enabledChannels = enabledChannels;
    this._quietHours = quietHours;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(props: CreateUserPreferencesProps): UserPreferences {
    const now = new Date();
    const channels: Record<NotificationChannel, boolean> = {
      [NotificationChannel.EMAIL]: props.enabledChannels?.[NotificationChannel.EMAIL] ?? true,
      [NotificationChannel.WEBHOOK]: props.enabledChannels?.[NotificationChannel.WEBHOOK] ?? true,
      [NotificationChannel.IN_APP]: props.enabledChannels?.[NotificationChannel.IN_APP] ?? true,
    };

    const quietHours = new QuietHours(
      props.quietHours ?? {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00',
        timezone: 'UTC',
      },
    );

    return new UserPreferences(props.userId, channels, quietHours, now, now);
  }

  static reconstitute(props: ReconstituteUserPreferencesProps): UserPreferences {
    return new UserPreferences(
      props.userId,
      props.enabledChannels,
      new QuietHours(props.quietHours),
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): string {
    return this._userId;
  }

  get enabledChannels(): Record<NotificationChannel, boolean> {
    return { ...this._enabledChannels };
  }

  get quietHours(): QuietHours {
    return this._quietHours;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  update(
    enabledChannels?: Partial<Record<NotificationChannel, boolean>>,
    quietHoursProps?: QuietHoursProps,
  ): void {
    if (enabledChannels) {
      this._enabledChannels = {
        ...this._enabledChannels,
        ...enabledChannels,
      };
    }
    if (quietHoursProps) {
      this._quietHours = new QuietHours(quietHoursProps);
    }
    this._updatedAt = new Date();
  }
}
