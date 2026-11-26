import { randomUUID } from 'node:crypto';

export class NotificationId {
  private readonly value: string;

  constructor(value?: string) {
    if (value && !NotificationId.isValidUuid(value)) {
      throw new Error(`Invalid NotificationId: ${value}`);
    }
    this.value = value ?? randomUUID();
  }

  static generate(): NotificationId {
    return new NotificationId();
  }

  static fromString(value: string): NotificationId {
    return new NotificationId(value);
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationId): boolean {
    return this.value === other.value;
  }

  private static isValidUuid(val: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(val);
  }
}
