import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // 요청 로깅
    this.logger.log(
      `Incoming Request: ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
    );

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const statusCode = response.statusCode;

        // 성공 응답 로깅
        this.logger.log(
          `Outgoing Response: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`,
        );

        // 성능 모니터링
        if (duration > 1000) {
          this.logger.warn(
            `Slow Request: ${method} ${url} took ${duration}ms`,
          );
        }

        // Sentry에 성능 데이터 전송
        if (process.env.SENTRY_DSN) {
          const Sentry = require('@sentry/node');
          Sentry.addBreadcrumb({
            category: 'http',
            type: 'http',
            data: {
              method,
              url,
              status_code: statusCode,
              duration,
            },
          });
        }
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const statusCode = error.status || 500;

        // 에러 로깅
        this.logger.error(
          `Request Error: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Error: ${error.message}`,
          error.stack,
        );

        // Sentry에 에러 전송
        if (process.env.SENTRY_DSN) {
          const Sentry = require('@sentry/node');
          Sentry.captureException(error, {
            extra: {
              method,
              url,
              statusCode,
              duration,
              userAgent,
              ip,
            },
            tags: {
              endpoint: `${method} ${url}`,
              status_code: statusCode.toString(),
            },
          });
        }

        throw error;
      }),
    );
  }
} 