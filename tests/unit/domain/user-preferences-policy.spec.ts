// tests/unit/domain/user-preferences-policy.spec.ts
import { describe, it, expect } from 'vitest';
import { UserPreferencesPolicy } from '../../../src/domain/services/user-preferences-policy.js';
import { UserPreferences } from '../../../src/domain/entities/user-preferences.entity.js';
import { NotificationChannel } from '../../../src/domain/enums/notification-channel.enum.js';

describe('UserPreferencesPolicy', () => {
  it('suppresses delivery during overnight quiet hours across timezones', () => {
    const policy = new UserPreferencesPolicy();
    const prefs = UserPreferences.create({
      userId: 'u-1',
      enabledChannels: {
        [NotificationChannel.EMAIL]: true,
        [NotificationChannel.WEBHOOK]: true,
        [NotificationChannel.IN_APP]: true,
      },
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '07:00',
        timezone: 'America/Sao_Paulo',
      },
    });

    // Review Focus #1 Test: 23:30 local in America/Sao_Paulo (UTC-3 is 02:30 UTC next day)
    const nightTimeUtc = new Date('2026-11-26T02:30:00Z');
    expect(policy.canReceive(prefs, NotificationChannel.EMAIL, nightTimeUtc)).toBe(false);

    // 06:45 local in America/Sao_Paulo (09:45 UTC) -> still before 07:00
    const earlyMorningUtc = new Date('2026-11-26T09:45:00Z');
    expect(policy.canReceive(prefs, NotificationChannel.EMAIL, earlyMorningUtc)).toBe(false);

    // 14:00 local in America/Sao_Paulo (17:00 UTC) -> outside quiet hours
    const dayTimeUtc = new Date('2026-11-25T17:00:00Z');
    expect(policy.canReceive(prefs, NotificationChannel.EMAIL, dayTimeUtc)).toBe(true);
  });

  it('rejects delivery if channel is disabled by user preferences', () => {
    const policy = new UserPreferencesPolicy();
    const prefs = UserPreferences.create({
      userId: 'u-2',
      enabledChannels: {
        [NotificationChannel.EMAIL]: false,
        [NotificationChannel.WEBHOOK]: true,
        [NotificationChannel.IN_APP]: true,
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00',
        timezone: 'UTC',
      },
    });

    const anyTime = new Date('2026-11-25T14:00:00Z');
    expect(policy.canReceive(prefs, NotificationChannel.EMAIL, anyTime)).toBe(false);
    expect(policy.canReceive(prefs, NotificationChannel.WEBHOOK, anyTime)).toBe(true);
  });
});
