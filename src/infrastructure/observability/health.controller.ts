import { Controller, Get, Res, HttpStatus, Optional, Inject } from '@nestjs/common';
import { Response } from 'express';
import mongoose from 'mongoose';

export interface HealthIndicators {
  mongodb?: () => boolean | Promise<boolean>;
  redis?: () => boolean | Promise<boolean>;
  rabbitmq?: () => boolean | Promise<boolean>;
}

@Controller('health')
export class HealthController {
  constructor(
    @Optional()
    @Inject('HEALTH_INDICATORS')
    private readonly customIndicators?: HealthIndicators,
  ) {}

  @Get('live')
  getLive() {
    return { status: 'UP' };
  }

  @Get('ready')
  async getReady(@Res() res: Response) {
    const checks: Record<string, 'UP' | 'DOWN'> = {
      mongodb: 'UP',
      redis: 'UP',
      rabbitmq: 'UP',
    };

    if (this.customIndicators) {
      if (this.customIndicators.mongodb) {
        const ok = await this.customIndicators.mongodb();
        checks.mongodb = ok ? 'UP' : 'DOWN';
      }
      if (this.customIndicators.redis) {
        const ok = await this.customIndicators.redis();
        checks.redis = ok ? 'UP' : 'DOWN';
      }
      if (this.customIndicators.rabbitmq) {
        const ok = await this.customIndicators.rabbitmq();
        checks.rabbitmq = ok ? 'UP' : 'DOWN';
      }
    } else {
      // Default connection check
      checks.mongodb = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
    }

    const isHealthy = Object.values(checks).every((status) => status === 'UP');
    const statusCode = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    res.status(statusCode).json({
      status: isHealthy ? 'UP' : 'DOWN',
      checks,
    });
  }
}
