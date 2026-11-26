// tests/integration/observability/health-and-metrics.spec.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HealthController } from '../../../src/infrastructure/observability/health.controller.js';
import { MetricsController } from '../../../src/infrastructure/observability/metrics.controller.js';
import { MetricsService } from '../../../src/infrastructure/observability/metrics.service.js';

describe('Observability Endpoints', () => {
  it('returns health liveness, readiness, and prometheus metrics', async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController, MetricsController],
      providers: [
        MetricsService,
        {
          provide: 'HEALTH_INDICATORS',
          useValue: { mongodb: () => true, redis: () => true, rabbitmq: () => true },
        },
      ],
    }).compile();

    const app: INestApplication = module.createNestApplication();
    await app.init();

    const liveRes = await request(app.getHttpServer()).get('/health/live').expect(200);
    expect(liveRes.body.status).toBe('UP');

    const readyRes = await request(app.getHttpServer()).get('/health/ready').expect(200);
    expect(readyRes.body.status).toBe('UP');
    expect(readyRes.body.checks).toEqual({ mongodb: 'UP', redis: 'UP', rabbitmq: 'UP' });

    const metricsRes = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(metricsRes.text).toContain('notifications_sent_total');

    await app.close();
  });
});
