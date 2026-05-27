import { Controller, Get } from '@nestjs/common';
import { HealthCheck } from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from '@app/health/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return this.healthService.liveness();
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (checks DB)' })
  readiness() {
    return this.healthService.readiness();
  }
}
