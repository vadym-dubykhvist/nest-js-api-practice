import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'NestJS Meetup (updated)' })
  @IsOptional()
  @IsString()
  readonly title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly location?: string;

  @ApiPropertyOptional({ example: '2026-09-15T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-15T21:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  readonly image?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly tags?: string[];

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly maxGuests?: number;
}
