import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'NestJS Meetup' })
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiPropertyOptional({ example: 'Hands-on workshop about NestJS modules.' })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiPropertyOptional({ example: 'Kyiv, UNIT.City' })
  @IsOptional()
  @IsString()
  readonly location?: string;

  @ApiProperty({ example: '2026-09-15T18:00:00.000Z' })
  @IsDateString()
  readonly startDate: string;

  @ApiProperty({ example: '2026-09-15T21:00:00.000Z' })
  @IsDateString()
  readonly endDate: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/event.png' })
  @IsOptional()
  @IsString()
  readonly image?: string;

  @ApiPropertyOptional({ example: ['nestjs', 'workshop'], type: [String] })
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
