import { Test, TestingModule } from '@nestjs/testing';

import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';
import { UpdateUserDto } from '@app/user/dto/updateUser.dto';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UserController } from '@app/user/user.controller';
import { UserEntity } from '@app/user/user.entity';
import { UserService } from '@app/user/user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const userServiceMock: Partial<jest.Mocked<UserService>> = {
      createUser: jest.fn(),
      login: jest.fn(),
      updateUser: jest.fn(),
      buildUserResponse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userServiceMock }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createUser', () => {
    it('delegates to UserService and returns the built response', async () => {
      const dto: CreateUserDto = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'pwd',
      };
      const savedUser = { id: 1, ...dto } as UserEntity;
      const response = { user: { ...savedUser, token: 't' } } as any;

      userService.createUser.mockResolvedValue(savedUser);
      userService.buildUserResponse.mockReturnValue(response);

      expect(await controller.createUser(dto)).toBe(response);
      expect(userService.createUser).toHaveBeenCalledWith(dto);
      expect(userService.buildUserResponse).toHaveBeenCalledWith(savedUser);
    });
  });

  describe('loginUser', () => {
    it('delegates to UserService.login and wraps response', async () => {
      const dto: LoginUserDto = {
        email: 'john@example.com',
        password: 'pwd',
      };
      const user = { id: 1, email: dto.email } as UserEntity;
      const response = { user: { ...user, token: 't' } } as any;

      userService.login.mockResolvedValue(user);
      userService.buildUserResponse.mockReturnValue(response);

      expect(await controller.loginUser(dto)).toBe(response);
      expect(userService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('currentUser', () => {
    const user = { id: 1, username: 'john_doe' } as UserEntity;

    it('returns null when no user is attached to the request', () => {
      expect(controller.currentUser(null as any, 'Token abc')).toBeNull();
      expect(userService.buildUserResponse).not.toHaveBeenCalled();
    });

    it('reuses the token from the authorization header', () => {
      const response = { user: { ...user, token: 'abc' } } as any;
      userService.buildUserResponse.mockReturnValue(response);

      expect(controller.currentUser(user, 'Token abc')).toBe(response);
      expect(userService.buildUserResponse).toHaveBeenCalledWith(user, 'abc');
    });

    it('passes undefined token when the header is missing', () => {
      const response = { user: { ...user, token: 'generated' } } as any;
      userService.buildUserResponse.mockReturnValue(response);

      controller.currentUser(user, undefined as any);

      expect(userService.buildUserResponse).toHaveBeenCalledWith(
        user,
        undefined,
      );
    });
  });

  describe('updateUser', () => {
    it('passes the current user id to UserService.updateUser', async () => {
      const dto: UpdateUserDto = {
        email: 'new@example.com',
        bio: 'b',
        image: 'i',
      };
      const currentUser = { id: 42 } as UserEntity;
      const updatedUser = { id: 42, email: dto.email } as UserEntity;
      const response = { user: { ...updatedUser, token: 't' } } as any;

      userService.updateUser.mockResolvedValue(updatedUser);
      userService.buildUserResponse.mockReturnValue(response);

      expect(await controller.updateUser(dto, currentUser)).toBe(response);
      expect(userService.updateUser).toHaveBeenCalledWith(42, dto);
    });
  });
});
