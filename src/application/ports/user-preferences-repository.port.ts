import { UserPreferences } from '../../domain/entities/user-preferences.entity.js';

export interface UserPreferencesRepositoryPort {
  save(preferences: UserPreferences): Promise<void>;
  findByUserId(userId: string): Promise<UserPreferences | null>;
}

export const UserPreferencesRepositoryPort = Symbol('UserPreferencesRepositoryPort');
