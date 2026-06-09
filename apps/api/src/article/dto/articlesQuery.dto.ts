import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/** Query params for `GET /articles`. Numeric params coerced from strings. */
export class ArticlesQueryDto {
  @IsOptional()
  @IsString()
  readonly tag?: string;

  @IsOptional()
  @IsString()
  readonly author?: string;

  @IsOptional()
  @IsString()
  readonly favorited?: string;

  @IsOptional()
  @IsString()
  readonly event?: string;

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
