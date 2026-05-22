import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { ObjectLiteral, Repository } from 'typeorm';

import { ExceptionService } from '@app/shared/services/exception.service';
import { CreateUserDto } from '@app/user/dto/createUser.dto';
import { LoginUserDto } from '@app/user/dto/loginUser.dto';
import { UpdateUserDto } from '@app/user/dto/updateUser.dto';
import { UserEntity } from '@app/user/user.entity';
import { UserService } from '@app/user/user.service';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral = ObjectLiteral,
>(): MockRepository<T> => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let userRepository: MockRepository<UserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: createMockRepository(),
        },
        ExceptionService,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<MockRepository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('creates and saves a new user when email and username are available', async () => {
      userRepository.findOne!.mockResolvedValueOnce(null); // email check
      userRepository.findOne!.mockResolvedValueOnce(null); // username check

      const savedUser = { id: 1, ...createUserDto } as UserEntity;
      userRepository.save!.mockResolvedValue(savedUser);

      const result = await service.createUser(createUserDto);

      expect(userRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: createUserDto.email },
      });
      expect(userRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { username: createUserDto.username },
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(createUserDto),
      );
      expect(result).toEqual(savedUser);
    });

    it('throws 422 with both errors when email and username are taken', async () => {
      userRepository.findOne!.mockResolvedValueOnce({ id: 1 });
      userRepository.findOne!.mockResolvedValueOnce({ id: 2 });

      await expect(service.createUser(createUserDto)).rejects.toMatchObject({
        response: {
          errors: {
            email: ['has already been taken'],
            username: ['has already been taken'],
          },
        },
        status: HttpStatus.UNPROCESSABLE_ENTITY,
      });

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('throws when only email is taken', async () => {
      userRepository.findOne!.mockResolvedValueOnce({ id: 1 });
      userRepository.findOne!.mockResolvedValueOnce(null);

      await expect(service.createUser(createUserDto)).rejects.toMatchObject({
        response: { errors: { email: ['has already been taken'] } },
      });
    });
  });

  describe('login', () => {
    const loginUserDto: LoginUserDto = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('returns a sanitized user (without password) on success', async () => {
      const existingUser = {
        id: 1,
        email: loginUserDto.email,
        username: 'john_doe',
        bio: '',
        image: '',
        password: 'hashed',
      } as UserEntity;

      userRepository.findOne!.mockResolvedValue(existingUser);
      (compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginUserDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: loginUserDto.email }],
        select: ['id', 'username', 'email', 'bio', 'image', 'password'],
      });
      expect(compare).toHaveBeenCalledWith(loginUserDto.password, 'hashed');
      expect(result).toEqual({
        id: 1,
        email: loginUserDto.email,
        username: 'john_doe',
        bio: '',
        image: '',
      });
      expect(result).not.toHaveProperty('password');
    });

    it('throws 422 when the user does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(service.login(loginUserDto)).rejects.toBeInstanceOf(
        HttpException,
      );
      expect(compare).not.toHaveBeenCalled();
    });

    it('throws 422 when password is invalid', async () => {
      userRepository.findOne!.mockResolvedValue({
        id: 1,
        password: 'hashed',
      });
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginUserDto)).rejects.toMatchObject({
        response: { errors: { 'email or password': ['is invalid'] } },
      });
    });
  });

  describe('findById', () => {
    it('returns user by id', async () => {
      const user = { id: 1 } as UserEntity;
      userRepository.findOne!.mockResolvedValue(user);

      const result = await service.findById(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(user);
    });

    it('returns null when user not found', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      expect(await service.findById(999)).toBeNull();
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'new@example.com',
      bio: 'updated bio',
      image: 'https://example.com/img.png',
    };

    it('merges payload into the existing user and saves', async () => {
      const existingUser = {
        id: 1,
        email: 'old@example.com',
        username: 'john_doe',
        bio: '',
        image: '',
      } as UserEntity;
      userRepository.findOne!.mockResolvedValue(existingUser);
      userRepository.save!.mockImplementation((u) => Promise.resolve(u));

      const result = await service.updateUser(1, updateUserDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          username: 'john_doe',
          ...updateUserDto,
        }),
      );
      expect(result.email).toBe(updateUserDto.email);
      expect(result.bio).toBe(updateUserDto.bio);
    });

    it('throws when user does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(service.updateUser(42, updateUserDto)).rejects.toMatchObject(
        {
          response: { errors: { user: ['not found'] } },
        },
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('generateJwt', () => {
    it('signs token with id, username, email using JWT_SECRET', () => {
      const originalSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'test-secret';
      (sign as jest.Mock).mockReturnValue('signed-token');

      const user = {
        id: 1,
        username: 'john_doe',
        email: 'john@example.com',
      } as UserEntity;

      const token = service.generateJwt(user);

      expect(sign).toHaveBeenCalledWith(
        { id: 1, username: 'john_doe', email: 'john@example.com' },
        'test-secret',
      );
      expect(token).toBe('signed-token');

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('buildUserResponse', () => {
    const user = {
      id: 1,
      email: 'john@example.com',
      username: 'john_doe',
      bio: '',
      image: '',
    } as UserEntity;

    it('reuses provided token without generating a new one', () => {
      const response = service.buildUserResponse(user, 'existing-token');

      expect(sign).not.toHaveBeenCalled();
      expect(response).toEqual({ user: { ...user, token: 'existing-token' } });
    });

    it('generates a new token when none is provided', () => {
      (sign as jest.Mock).mockReturnValue('fresh-token');

      const response = service.buildUserResponse(user);

      expect(sign).toHaveBeenCalled();
      expect(response.user.token).toBe('fresh-token');
    });
  });
});
