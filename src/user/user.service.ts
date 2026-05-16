import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { compare } from 'bcrypt';

import { UserResponseInterface } from '@app/user/types/userResponse.interfaces';

import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';
import { UserEntity } from '@app/user/user.entity';
import { UpdateUserDto } from '@app/user/dto/updateUser.dto';
import { ExceptionService } from '@app/shared/services/exception.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly exceptionService: ExceptionService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const errorResponse = {
      errors: {},
    };
    const isUserEmailExists = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    const isUsernameExists = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (isUserEmailExists) {
      errorResponse.errors['email'] = ['has already been taken'];
    }
    if (isUsernameExists) {
      errorResponse.errors['username'] = ['has already been taken'];
    }

    if (Object.keys(errorResponse.errors).length) {
      this.exceptionService.throwHttpExceptionWithErrors(errorResponse.errors);
    }

    const newUser = new UserEntity();

    Object.assign(newUser, createUserDto);

    return await this.userRepository.save(newUser);
  }

  async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: loginUserDto.email }],
      select: ['id', 'username', 'email', 'bio', 'image', 'password'],
    });

    if (!existingUser) {
      this.exceptionService.throwHttpException(
        'email or password',
        'is invalid',
      );
    }

    const isPasswordValid = await compare(
      loginUserDto.password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      this.exceptionService.throwHttpException(
        'email or password',
        'is invalid',
      );
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      username: existingUser.username,
      bio: existingUser.bio,
      image: existingUser.image,
    } as UserEntity;
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) this.exceptionService.throwHttpException('user', 'not found');

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  generateJwt(user: UserEntity): string {
    return sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET!,
    );
  }

  buildUserResponse(user: UserEntity, token?: string): UserResponseInterface {
    return {
      user: {
        ...user,
        token: token ?? this.generateJwt(user),
      },
    };
  }
}
