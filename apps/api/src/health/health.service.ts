import { Injectable } from '@nestjs/common';
import {
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  readiness(): Promise<HealthCheckResult> {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
