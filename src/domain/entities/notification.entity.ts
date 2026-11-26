import { randomUUID } from 'node:crypto';
import { NotificationChannel } from '../enums/notification-channel.enum.js';
import { NotificationStatus } from '../enums/notification-status.enum.js';
import { DomainEvent } from '../events/domain-event.interface.js';
import { NotificationCreatedEvent } from '../events/notification-created.event.js';
import { NotificationQueuedEvent } from '../events/notification-queued.event.js';
import { NotificationSentEvent } from '../events/notification-sent.event.js';
import { NotificationFailedEvent } from '../events/notification-failed.event.js';

export interface CreateNotificationProps {
  id?: string;
  userId: string;
  channel: NotificationChannel;
  recipient: string;
  templateKey: string;
  data: Record<string, unknown>;
  correlationId: string;
}

export interface ReconstituteNotificationProps {
  id: string;
  userId: string;
  channel: NotificationChannel;
  recipient: string;
  templateKey: string;
  data: Record<string, unknown>;
  correlationId: string;
  status: NotificationStatus;
  sentAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Notification {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _channel: NotificationChannel;
  private readonly _recipient: string;
  private readonly _templateKey: string;
  private readonly _data: Record<string, unknown>;
  private readonly _correlationId: string;
  private _status: NotificationStatus;
  private _sentAt?: Date;
  private _failedAt?: Date;
  private _failureReason?: string;
  private _attempts: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    id: string,
    userId: string,
    channel: NotificationChannel,
    recipient: string,
    templateKey: string,
    data: Record<string, unknown>,
    correlationId: string,
    status: NotificationStatus,
    attempts: number,
    createdAt: Date,
    updatedAt: Date,
    sentAt?: Date,
    failedAt?: Date,
    failureReason?: string,
  ) {
    this._id = id;
    this._userId = userId;
    this._channel = channel;
    this._recipient = recipient;
    this._templateKey = templateKey;
    this._data = data;
    this._correlationId = correlationId;
    this._status = status;
    this._attempts = attempts;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._sentAt = sentAt;
    this._failedAt = failedAt;
    this._failureReason = failureReason;
  }

  static create(props: CreateNotificationProps): Notification {
    const id = props.id ?? randomUUID();
    const now = new Date();
    const notification = new Notification(
      id,
      props.userId,
      props.channel,
      props.recipient,
      props.templateKey,
      props.data,
      props.correlationId,
      NotificationStatus.PENDING,
      0,
      now,
      now,
    );

    notification._domainEvents.push(
      new NotificationCreatedEvent(id, props.correlationId, {
        userId: props.userId,
        channel: props.channel,
        recipient: props.recipient,
        templateKey: props.templateKey,
        data: props.data,
      }),
    );

    return notification;
  }

  static reconstitute(props: ReconstituteNotificationProps): Notification {
    return new Notification(
      props.id,
      props.userId,
      props.channel,
      props.recipient,
      props.templateKey,
      props.data,
      props.correlationId,
      props.status,
      props.attempts,
      props.createdAt,
      props.updatedAt,
      props.sentAt,
      props.failedAt,
      props.failureReason,
    );
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get channel(): NotificationChannel {
    return this._channel;
  }

  get recipient(): string {
    return this._recipient;
  }

  get templateKey(): string {
    return this._templateKey;
  }

  get data(): Record<string, unknown> {
    return { ...this._data };
  }

  get correlationId(): string {
    return this._correlationId;
  }

  get status(): NotificationStatus {
    return this._status;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get failedAt(): Date | undefined {
    return this._failedAt;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  get attempts(): number {
    return this._attempts;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  markAsQueued(): void {
    if (this._status !== NotificationStatus.PENDING) {
      throw new Error(`Invalid state transition: Cannot transition from ${this._status} to QUEUED`);
    }
    this._status = NotificationStatus.QUEUED;
    this._updatedAt = new Date();
    this._domainEvents.push(
      new NotificationQueuedEvent(this._id, this._correlationId, {
        userId: this._userId,
        channel: this._channel,
      }),
    );
  }

  markAsSent(): void {
    if (this._status !== NotificationStatus.QUEUED && this._status !== NotificationStatus.PENDING) {
      throw new Error(`Invalid state transition: Cannot transition from ${this._status} to SENT`);
    }
    this._status = NotificationStatus.SENT;
    this._sentAt = new Date();
    this._updatedAt = new Date();
    this._domainEvents.push(
      new NotificationSentEvent(this._id, this._correlationId, {
        userId: this._userId,
        channel: this._channel,
        sentAt: this._sentAt,
      }),
    );
  }

  markAsFailed(reason: string, attempts = 1): void {
    if (this._status === NotificationStatus.SENT) {
      throw new Error(`Invalid state transition: Cannot transition from SENT to FAILED`);
    }
    this._status = NotificationStatus.FAILED;
    this._failureReason = reason;
    this._attempts = attempts;
    this._failedAt = new Date();
    this._updatedAt = new Date();
    this._domainEvents.push(
      new NotificationFailedEvent(this._id, this._correlationId, reason, attempts, {
        userId: this._userId,
        channel: this._channel,
      }),
    );
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
