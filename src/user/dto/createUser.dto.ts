import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Public username for the new account.',
    example: 'john_doe',
  })
  @IsNotEmpty()
  readonly username: string;

  @ApiProperty({
    description: 'Email address used to sign in.',
    example: 'john@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    description: 'Password for the new account.',
    example: 'password123',
  })
  @IsNotEmpty()
  readonly password: string;
}
