import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Histogram } from 'prom-client';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    private readonly histogram: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const routePath = (req.route as { path?: string } | undefined)?.path;
    const route: string = routePath ?? 'unknown';
    const method: string = req.method;
    const endTimer = this.histogram.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => endTimer({ status_code: String(res.statusCode) }),
        error: (err: { status?: number }) =>
          endTimer({ status_code: String(err?.status ?? 500) }),
      }),
    );
  }
}
