import { UserPreferencesRepositoryPort } from '../../../../application/ports/user-preferences-repository.port.js';
import { UserPreferences } from '../../../../domain/entities/user-preferences.entity.js';
import { UserPreferencesModel, UserPreferencesDocument } from '../schemas/user-preferences.schema.js';
import { NotificationChannel } from '../../../../domain/enums/notification-channel.enum.js';

export class MongoUserPreferencesRepository implements UserPreferencesRepositoryPort {
  async save(preferences: UserPreferences): Promise<void> {
    await UserPreferencesModel.findByIdAndUpdate(
      preferences.userId,
      {
        $set: {
          userId: preferences.userId,
          enabledChannels: preferences.enabledChannels,
          quietHours: preferences.quietHours,
          updatedAt: preferences.updatedAt,
        },
        $setOnInsert: {
          _id: preferences.userId,
          createdAt: preferences.createdAt,
        },
      },
      { upsert: true, new: true },
    );
  }

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const doc = await UserPreferencesModel.findById(userId).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  private toDomain(doc: UserPreferencesDocument): UserPreferences {
    const rawChannels = doc.enabledChannels instanceof Map
      ? Object.fromEntries(doc.enabledChannels)
      : doc.enabledChannels;

    const channels: Record<NotificationChannel, boolean> = {
      [NotificationChannel.EMAIL]: rawChannels?.[NotificationChannel.EMAIL] ?? true,
      [NotificationChannel.WEBHOOK]: rawChannels?.[NotificationChannel.WEBHOOK] ?? true,
      [NotificationChannel.IN_APP]: rawChannels?.[NotificationChannel.IN_APP] ?? true,
    };

    return UserPreferences.reconstitute({
      userId: doc.userId,
      enabledChannels: channels,
      quietHours: {
        enabled: doc.quietHours?.enabled ?? false,
        startTime: doc.quietHours?.startTime ?? '22:00',
        endTime: doc.quietHours?.endTime ?? '07:00',
        timezone: doc.quietHours?.timezone ?? 'UTC',
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
