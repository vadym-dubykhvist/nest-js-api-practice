import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Put,
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

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('users')
  @UsePipes(new BackendValidationPipe())
  async createUser(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.createUser(createUserDto);

    return this.userService.buildUserResponse(user);
  }

  @Post('users/login')
  @UsePipes(new BackendValidationPipe())
  async loginUser(
    @Body('user') loginUserDto: LoginUserDto,
  ): Promise<UserResponseInterface> {
    const user = await this.userService.login(loginUserDto);

    return this.userService.buildUserResponse(user);
  }

  @Get('user')
  @UseGuards(AuthGuard)
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

  @Put('user')
  @UseGuards(AuthGuard)
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
