import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UserService } from '@app/user/user.service';
import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';
import type { UserResponseInterface } from '@app/user/types/userResponse.interfaces';
import { User } from '@app/user/decorators/user.decorator';
import { UserEntity } from '@app/user/user.entity';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UpdateUserDto } from '@app/user/dto/updateUser.dto';
import { BackendValidationPipe } from '@app/shared/pipes/backendValidation.pipe';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

@ApiTags('users')
@ApiExtraModels(CreateUserDto, LoginUserDto, UpdateUserDto)
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('users')
  @ApiOperation({
    summary: 'Register user',
    description:
      'Creates a new user account and returns the user with a token.',
  })
  @ApiBody({
    description: 'Registration payload wrapped in a user object.',
    schema: {
      type: 'object',
      required: ['user'],
      properties: {
        user: { $ref: getSchemaPath(CreateUserDto) },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User created and returned with an authentication token.',
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed or email/username is already taken.',
  })
  @UsePipes(new BackendValidationPipe())
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.createUser(createUserDto);

    return this.userService.buildUserResponse(user);
  }

  @Post('users/login')
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates a user and returns the user with a token.',
  })
  @ApiBody({
    description: 'Login payload wrapped in a user object.',
    schema: {
      type: 'object',
      required: ['user'],
      properties: {
        user: { $ref: getSchemaPath(LoginUserDto) },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'User authenticated and returned with an authentication token.',
  })
  @ApiResponse({
    status: 422,
    description:
      'Validation failed or the email/password combination is invalid.',
  })
  @UsePipes(new BackendValidationPipe())
  async loginUser(
    @Body('user') loginUserDto: LoginUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.login(loginUserDto);

    return this.userService.buildUserResponse(user);
  }

  @Get('user')
  @ApiOperation({
    summary: 'Get current user',
    description:
      'Returns the authenticated user from the Token authorization header.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiResponse({
    status: 200,
    description: 'Current user returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  currentUser(
    @User() user: UserEntity,
    @Headers('authorization') auth: string,
  ): UserResponseInterface | null {
    if (!user) {
      return null;
    }
    const token = auth?.split(' ')[1];
    return this.userService.buildUserResponse(user, token);
  }

  @Patch('user')
  @ApiOperation({
    summary: 'Update current user',
    description: 'Updates fields on the authenticated user profile.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiBody({
    description: 'User update payload wrapped in a user object.',
    schema: {
      type: 'object',
      required: ['user'],
      properties: {
        user: { $ref: getSchemaPath(UpdateUserDto) },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User updated and returned.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed for one or more user fields.',
  })
  async updateUser(
    @Body('user') updateUserDto: UpdateUserDto,
    @User() user: UserEntity,
  ): Promise<UserResponseInterface> {
    const updatedUser = await this.userService.updateUser(
      user.id,
      updateUserDto,
    );

    return this.userService.buildUserResponse(updatedUser);
  }
}
