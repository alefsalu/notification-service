import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisRateLimitGuard implements CanActivate {
  private readonly redis?: Redis;

  constructor(redisClient?: Redis) {
    if (redisClient) {
      this.redis = redisClient;
    } else if (process.env.NODE_ENV !== 'test') {
      const host = process.env.REDIS_HOST ?? 'localhost';
      const port = parseInt(process.env.REDIS_PORT ?? '6380', 10);
      this.redis = new Redis({ host, port, lazyConnect: true });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.redis) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const userId = request.user?.sub ?? request.ip ?? 'anonymous';
    const key = `ratelimit:${userId}`;

    try {
      const current = await this.redis.incr(key);
      if (current === 1) {
        await this.redis.expire(key, 60);
      }

      if (current > 100) {
        response.setHeader('Retry-After', '60');
        throw new HttpException(
          {
            message: 'Too many requests. Please wait before retrying.',
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err: unknown) {
      if (err instanceof HttpException) {
        throw err;
      }
      // If Redis has connection error, allow request to proceed (fail open)
    }

    return true;
  }
}
