import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment text' })
  @IsNotEmpty()
  @IsString()
  readonly body: string;
}
