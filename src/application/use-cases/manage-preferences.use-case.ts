import { UserPreferencesRepositoryPort } from '../ports/user-preferences-repository.port.js';
import { UserPreferences } from '../../domain/entities/user-preferences.entity.js';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum.js';
import { QuietHoursProps } from '../../domain/value-objects/quiet-hours.vo.js';

export interface UpdatePreferencesCommand {
  userId: string;
  enabledChannels?: Partial<Record<NotificationChannel, boolean>>;
  quietHours?: QuietHoursProps;
}

export class ManagePreferencesUseCase {
  constructor(private readonly preferencesRepository: UserPreferencesRepositoryPort) {}

  async getByUserId(userId: string): Promise<UserPreferences> {
    const existing = await this.preferencesRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const defaultPrefs = UserPreferences.create({ userId });
    await this.preferencesRepository.save(defaultPrefs);
    return defaultPrefs;
  }

  async update(command: UpdatePreferencesCommand): Promise<UserPreferences> {
    let prefs = await this.preferencesRepository.findByUserId(command.userId);
    if (!prefs) {
      prefs = UserPreferences.create({
        userId: command.userId,
        enabledChannels: command.enabledChannels,
        quietHours: command.quietHours,
      });
    } else {
      prefs.update(command.enabledChannels, command.quietHours);
    }

    await this.preferencesRepository.save(prefs);
    return prefs;
  }
}
