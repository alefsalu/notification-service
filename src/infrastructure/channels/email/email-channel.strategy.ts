import nodemailer from 'nodemailer';
import { ChannelStrategyPort, ChannelDeliveryResult } from '../../../application/ports/channel-strategy.port.js';
import { Notification } from '../../../domain/entities/notification.entity.js';
import { NotificationChannel } from '../../../domain/enums/notification-channel.enum.js';

export class EmailChannelStrategy implements ChannelStrategyPort {
  readonly channel = NotificationChannel.EMAIL;
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(transporter?: nodemailer.Transporter, fromAddress?: string) {
    this.fromAddress = fromAddress ?? process.env.EMAIL_FROM ?? 'noreply@portfolio.local';
    this.transporter =
      transporter ??
      nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? 'localhost',
        port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
        ignoreTLS: true,
      });
  }

  async send(notification: Notification, subject: string, body: string): Promise<ChannelDeliveryResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: notification.recipient,
        subject,
        text: body,
        html: `<p>${body}</p>`,
        headers: {
          'X-Correlation-Id': notification.correlationId,
        },
      });

      return {
        success: true,
        externalMessageId: info.messageId,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}
