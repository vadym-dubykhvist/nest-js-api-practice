import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Query params for `GET /events`. Query-string values arrive as strings, so
 * `@Type(() => Number)` (+ the global ValidationPipe `transform`) coerces the
 * numeric ones — otherwise TypeORM's limit/offset reject a string.
 */
export class EventsQueryDto {
  @IsOptional()
  @IsString()
  readonly tag?: string;

  @IsOptional()
  @IsString()
  readonly location?: string;

  @IsOptional()
  @IsString()
  readonly author?: string;

  @IsOptional()
  @IsString()
  readonly search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly offset?: number;
}
