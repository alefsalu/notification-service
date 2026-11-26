import { UserPreferences } from '../entities/user-preferences.entity.js';
import { NotificationChannel } from '../enums/notification-channel.enum.js';

export class UserPreferencesPolicy {
  canReceive(prefs: UserPreferences, channel: NotificationChannel, timestampUtc: Date = new Date()): boolean {
    const isChannelEnabled = prefs.enabledChannels[channel] ?? true;
    if (!isChannelEnabled) {
      return false;
    }

    if (!prefs.quietHours.enabled) {
      return true;
    }

    return !this.isInQuietHours(prefs, timestampUtc);
  }

  private isInQuietHours(prefs: UserPreferences, timestampUtc: Date): boolean {
    const { startTime, endTime, timezone } = prefs.quietHours;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(timestampUtc);
    const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minutePart = parts.find((p) => p.type === 'minute')?.value ?? '00';

    const currentHour = parseInt(hourPart, 10) % 24;
    const currentMinute = parseInt(minutePart, 10);
    const currentMinutes = currentHour * 60 + currentMinute;

    const [startH, startM] = startTime.split(':').map((v) => parseInt(v, 10));
    const [endH, endM] = endTime.split(':').map((v) => parseInt(v, 10));
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes < endMinutes) {
      // Daytime quiet hours: e.g. 13:00 to 14:00
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight quiet hours spanning midnight: e.g. 22:00 to 07:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }
}
