import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateArticleDto {
  @ApiProperty({
    description: 'Updated article title.',
    example: 'How to build a production NestJS API',
  })
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({
    description: 'Updated article content.',
    example: 'This updated article covers services, controllers, and guards...',
  })
  @IsNotEmpty()
  readonly body: string;

  @ApiProperty({
    description: 'Updated short article summary.',
    example: 'An updated guide to production NestJS APIs.',
  })
  @IsNotEmpty()
  readonly description: string;

  @ApiPropertyOptional({
    description: 'Event ID this article is linked to. Pass null to unlink.',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  readonly eventId?: number | null;
}
