// tests/integration/http/rfc7807-filter.spec.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Rfc7807ExceptionFilter } from '../../../src/presentation/http/filters/rfc7807-exception.filter.js';
import { NotificationsController } from '../../../src/presentation/http/controllers/notifications.controller.js';
import { SendNotificationUseCase } from '../../../src/application/use-cases/send-notification.use-case.js';
import { GetNotificationUseCase } from '../../../src/application/use-cases/get-notification.use-case.js';
import { ListUserNotificationsUseCase } from '../../../src/application/use-cases/list-user-notifications.use-case.js';
import { CorrelationIdMiddleware } from '../../../src/presentation/http/middlewares/correlation-id.middleware.js';
import { SecurityHeadersMiddleware } from '../../../src/presentation/http/middlewares/security-headers.middleware.js';
import { TokenVerifierPort } from '../../../src/application/ports/token-verifier.port.js';

describe('HTTP Presentation Layer', () => {
  it('returns RFC 7807 problem details on 400 validation error with security headers', async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: SendNotificationUseCase, useValue: { execute: () => Promise.resolve() } },
        { provide: GetNotificationUseCase, useValue: { execute: () => Promise.resolve() } },
        { provide: ListUserNotificationsUseCase, useValue: { execute: () => Promise.resolve() } },
        {
          provide: TokenVerifierPort,
          useValue: {
            verify: () =>
              Promise.resolve({
                sub: 'user-123',
                email: 'user@test.com',
                roles: ['USER'],
                iss: 'wallet-api',
                aud: 'portfolio',
                exp: 9999999999,
              }),
          },
        },
      ],
    }).compile();

    const app: INestApplication = module.createNestApplication();
    app.use(new CorrelationIdMiddleware().use);
    app.use(new SecurityHeadersMiddleware().use);
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new Rfc7807ExceptionFilter());
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/api/v1/notifications')
      .set('Authorization', 'Bearer dummy-token')
      .send({}) // Invalid body missing required fields
      .expect(400);

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-correlation-id']).toBeDefined();
    expect(response.body).toEqual(
      expect.objectContaining({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        code: 'VALIDATION_ERROR',
        errors: expect.any(Array),
      }),
    );

    await app.close();
  });
});
