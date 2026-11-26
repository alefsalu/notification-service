import { NotificationChannel } from '../enums/notification-channel.enum.js';

export interface CreateTemplateProps {
  key: string;
  channel: NotificationChannel;
  subject: string;
  bodyTemplate: string;
}

export interface ReconstituteTemplateProps {
  key: string;
  channel: NotificationChannel;
  subject: string;
  bodyTemplate: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Template {
  private readonly _key: string;
  private readonly _channel: NotificationChannel;
  private _subject: string;
  private _bodyTemplate: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    key: string,
    channel: NotificationChannel,
    subject: string,
    bodyTemplate: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this._key = key;
    this._channel = channel;
    this._subject = subject;
    this._bodyTemplate = bodyTemplate;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static create(props: CreateTemplateProps): Template {
    if (!props.key || props.key.trim().length === 0) {
      throw new Error('Template key cannot be empty');
    }
    const now = new Date();
    return new Template(props.key, props.channel, props.subject, props.bodyTemplate, now, now);
  }

  static reconstitute(props: ReconstituteTemplateProps): Template {
    return new Template(props.key, props.channel, props.subject, props.bodyTemplate, props.createdAt, props.updatedAt);
  }

  get key(): string {
    return this._key;
  }

  get channel(): NotificationChannel {
    return this._channel;
  }

  get subject(): string {
    return this._subject;
  }

  get bodyTemplate(): string {
    return this._bodyTemplate;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  update(subject: string, bodyTemplate: string): void {
    this._subject = subject;
    this._bodyTemplate = bodyTemplate;
    this._updatedAt = new Date();
  }
}
