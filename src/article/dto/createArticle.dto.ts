import { IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Article title.',
    example: 'How to build a NestJS API',
  })
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({
    description: 'Short article summary.',
    example: 'A practical guide to building APIs with NestJS.',
  })
  @IsNotEmpty()
  readonly description: string;

  @ApiProperty({
    description: 'Full article content.',
    example: 'NestJS gives you a structured way to build Node.js APIs...',
  })
  @IsNotEmpty()
  readonly body: string;

  @ApiPropertyOptional({
    description: 'Tags assigned to the article.',
    example: ['nestjs', 'api'],
    type: [String],
  })
  readonly tagList?: string[];
}
