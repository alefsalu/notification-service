import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable } from '@nestjs/common';
import { TokenVerifierPort } from '../../application/ports/token-verifier.port.js';
import { WebsocketBroadcasterPort } from '../../application/ports/websocket-broadcaster.port.js';
import { createSocketAuthMiddleware } from './socket-auth.middleware.js';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebsocketBroadcasterPort
{
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(TokenVerifierPort)
    private readonly tokenVerifier: TokenVerifierPort,
  ) {}

  afterInit(server: Server): void {
    server.use(createSocketAuthMiddleware(this.tokenVerifier));
  }

  handleConnection(client: Socket): void {
    const user = client.data?.user;
    if (user?.sub) {
      const room = `user:${user.sub}`;
      client.join(room);
    }
  }

  handleDisconnect(_client: Socket): void {
    // room cleanup handled automatically by Socket.IO
  }

  async sendToUser(userId: string, event: string, payload: unknown): Promise<boolean> {
    if (!this.server) {
      return false;
    }
    this.server.to(`user:${userId}`).emit(event, payload);
    return true;
  }
}
