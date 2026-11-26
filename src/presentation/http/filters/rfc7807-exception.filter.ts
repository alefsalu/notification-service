import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationErrorItem {
  field: string;
  message: string;
}

@Catch()
export class Rfc7807ExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred';
    let code = 'INTERNAL_SERVER_ERROR';
    let errors: ValidationErrorItem[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        detail = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        detail = (obj.message as string) || exception.message;

        if (Array.isArray(obj.message)) {
          detail = 'Validation failed';
          errors = obj.message.map((msg) => {
            if (typeof msg === 'string') {
              const parts = msg.split(' ');
              return { field: parts[0] || 'field', message: msg };
            }
            return { field: 'field', message: String(msg) };
          });
        }
      }

      switch (status) {
        case HttpStatus.BAD_REQUEST:
          title = 'Bad Request';
          code = errors ? 'VALIDATION_ERROR' : 'BAD_REQUEST';
          break;
        case HttpStatus.UNAUTHORIZED:
          title = 'Unauthorized';
          code = 'UNAUTHORIZED';
          break;
        case HttpStatus.FORBIDDEN:
          title = 'Forbidden';
          code = 'FORBIDDEN';
          break;
        case HttpStatus.NOT_FOUND:
          title = 'Not Found';
          code = 'NOT_FOUND';
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          title = 'Too Many Requests';
          code = 'RATE_LIMITED';
          break;
        case HttpStatus.UNPROCESSABLE_ENTITY:
          title = 'Unprocessable Entity';
          code = 'UNPROCESSABLE_ENTITY';
          break;
        default:
          title = exception.name || 'Error';
          code = 'ERROR';
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      if (exception.message.startsWith('FORBIDDEN')) {
        status = HttpStatus.FORBIDDEN;
        title = 'Forbidden';
        code = 'FORBIDDEN';
      } else if (exception.message.startsWith('UNAUTHORIZED')) {
        status = HttpStatus.UNAUTHORIZED;
        title = 'Unauthorized';
        code = 'UNAUTHORIZED';
      }
    }

    const problemDetails = {
      type: 'about:blank',
      title,
      status,
      detail,
      instance: request.url,
      code,
      ...(errors ? { errors } : {}),
    };

    response.setHeader('Content-Type', 'application/problem+json');
    response.status(status).json(problemDetails);
  }
}
