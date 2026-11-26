// tests/integration/websocket/notification.gateway.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as Client, Socket } from 'socket.io-client';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { NotificationGateway } from '../../../src/infrastructure/websocket/notification.gateway.js';
import { TokenVerifierPort } from '../../../src/application/ports/token-verifier.port.js';

describe('NotificationGateway', () => {
  let app: INestApplication;
  let verifierMock: TokenVerifierPort;
  let clientSocket: Socket;

  beforeAll(async () => {
    verifierMock = {
      verify: (token: string) => {
        if (token === 'valid-token') {
          return Promise.resolve({
            sub: 'user-777',
            email: 'u@test.com',
            roles: ['USER'],
            iss: 'wallet-api',
            aud: 'portfolio',
            exp: Date.now() + 10000,
            jti: '1',
          });
        }
        return Promise.reject(new Error('Invalid token'));
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [NotificationGateway, { provide: TokenVerifierPort, useValue: verifierMock }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(8090);
  });

  afterAll(async () => {
    if (clientSocket?.connected) clientSocket.disconnect();
    await app.close();
  });

  // Review Focus #5 Test
  it('rejects connection on expired or invalid token', async () => {
    const rejectedSocket = Client('http://localhost:8090', { auth: { token: 'expired-token' } });
    await new Promise<void>((resolve) => {
      rejectedSocket.on('connect_error', (err) => {
        expect(err.message).toMatch(/UNAUTHORIZED|Invalid token/);
        rejectedSocket.close();
        resolve();
      });
    });
  });

  it('allows authenticated client to connect and receive broadcast message', async () => {
    clientSocket = Client('http://localhost:8090', { auth: { token: 'valid-token' } });

    await new Promise<void>((resolve, reject) => {
      clientSocket.on('connect', () => {
        resolve();
      });
      clientSocket.on('connect_error', reject);
    });

    const gateway = app.get(NotificationGateway);
    const messagePromise = new Promise<any>((resolve) => {
      clientSocket.on('notification', (data) => {
        resolve(data);
      });
    });

    await gateway.sendToUser('user-777', 'notification', { message: 'Hello user 777' });
    const received = await messagePromise;
    expect(received.message).toBe('Hello user 777');
  });
});
