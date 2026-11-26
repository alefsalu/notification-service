import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label) {
          return { level: label };
        },
      },
      base: {
        service: 'notification-service',
      },
    });
  }

  log(message: string, context?: string, correlationId?: string): void {
    this.logger.info({ context, correlationId }, message);
  }

  error(message: string, trace?: string, context?: string, correlationId?: string): void {
    this.logger.error({ trace, context, correlationId }, message);
  }

  warn(message: string, context?: string, correlationId?: string): void {
    this.logger.warn({ context, correlationId }, message);
  }

  debug(message: string, context?: string, correlationId?: string): void {
    this.logger.debug({ context, correlationId }, message);
  }

  verbose(message: string, context?: string, correlationId?: string): void {
    this.logger.trace({ context, correlationId }, message);
  }
}
