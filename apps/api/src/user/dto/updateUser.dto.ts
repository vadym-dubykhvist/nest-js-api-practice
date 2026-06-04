import { IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'New email address for the current user.',
    example: 'john.updated@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Short biography displayed on the user profile.',
    example: 'Building APIs with NestJS.',
  })
  bio: string;

  @ApiPropertyOptional({
    description: 'URL of the user profile image.',
    example: 'https://example.com/images/john.png',
  })
  image: string;
}
