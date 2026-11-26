import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { INestApplicationContext } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext, private readonly redisUrl?: string) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const host = process.env.REDIS_HOST ?? 'localhost';
    const port = parseInt(process.env.REDIS_PORT ?? '6380', 10);
    const pubClient = this.redisUrl ? new Redis(this.redisUrl) : new Redis({ host, port });
    const subClient = pubClient.duplicate();

    await Promise.all([
      new Promise((res) => pubClient.once('ready', res)),
      new Promise((res) => subClient.once('ready', res)),
    ]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  override createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
