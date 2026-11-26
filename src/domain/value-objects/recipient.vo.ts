import { NotificationChannel } from '../enums/notification-channel.enum.js';

export class Recipient {
  private readonly value: string;
  private readonly channel: NotificationChannel;

  constructor(value: string, channel: NotificationChannel) {
    if (!value || value.trim().length === 0) {
      throw new Error('Recipient cannot be empty');
    }
    this.validateForChannel(value, channel);
    this.value = value.trim();
    this.channel = channel;
  }

  static create(value: string, channel: NotificationChannel): Recipient {
    return new Recipient(value, channel);
  }

  getValue(): string {
    return this.value;
  }

  getChannel(): NotificationChannel {
    return this.channel;
  }

  toString(): string {
    return this.value;
  }

  private validateForChannel(value: string, channel: NotificationChannel): void {
    if (channel === NotificationChannel.EMAIL) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        throw new Error(`Invalid email address: ${value}`);
      }
    } else if (channel === NotificationChannel.WEBHOOK) {
      try {
        const url = new URL(value);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error(`Invalid webhook URL protocol: ${value}`);
        }
      } catch {
        throw new Error(`Invalid webhook URL: ${value}`);
      }
    }
    // For IN_APP, recipient can be a user UUID
  }
}
