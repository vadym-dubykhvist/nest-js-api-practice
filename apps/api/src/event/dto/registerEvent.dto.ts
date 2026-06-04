import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterEventDto {
  @ApiPropertyOptional({
    example: 'john@example.com',
    description:
      'Required for anonymous registration. Ignored when authenticated (taken from profile).',
  })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description:
      'Required for anonymous registration. Ignored when authenticated (taken from profile).',
  })
  @IsOptional()
  @IsString()
  readonly name?: string;

  @ApiPropertyOptional({ example: 'Vegetarian, needs parking' })
  @IsOptional()
  @IsString()
  readonly additionalInfo?: string;
}
