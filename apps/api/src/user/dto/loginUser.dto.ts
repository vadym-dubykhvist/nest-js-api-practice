import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    description: 'Email address for the account.',
    example: 'john@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    description: 'Password for the account.',
    example: 'password123',
  })
  @IsNotEmpty()
  readonly password: string;
}
