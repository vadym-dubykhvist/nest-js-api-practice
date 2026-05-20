import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great article!' })
  @IsNotEmpty()
  @IsString()
  readonly body: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Parent comment ID for nested replies',
  })
  @IsOptional()
  @IsNumber()
  readonly parentId?: number;
}
