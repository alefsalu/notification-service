import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use = (req: Request, res: Response, next: NextFunction): void => {
    const correlationIdHeader = req.headers['x-correlation-id'];
    const correlationId =
      typeof correlationIdHeader === 'string' && correlationIdHeader.trim().length > 0
        ? correlationIdHeader
        : randomUUID();

    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    next();
  };
}
