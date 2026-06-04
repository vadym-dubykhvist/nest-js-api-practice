import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';

import { FollowEntity } from '@app/profile/follow.entity';
import { ProfileService } from '@app/profile/profile.service';
import { ExceptionService } from '@app/shared/services/exception.service';
import { UserEntity } from '@app/user/user.entity';

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral = ObjectLiteral,
>(): MockRepository<T> => ({
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('ProfileService', () => {
  let service: ProfileService;
  let userRepository: MockRepository<UserEntity>;
  let followRepository: MockRepository<FollowEntity>;

  const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity =>
    ({
      id: 10,
      username: 'jane',
      email: 'jane@example.com',
      bio: 'about jane',
      image: 'img.png',
      password: 'hash',
      articles: [],
      favorites: [],
      ...overrides,
    }) as UserEntity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(FollowEntity),
          useValue: createMockRepository(),
        },
        ExceptionService,
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    followRepository = module.get(getRepositoryToken(FollowEntity));
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('returns the profile with following=true when a follow relation exists', async () => {
      const profileUser = buildUser();
      userRepository.findOne!.mockResolvedValue(profileUser);
      followRepository.findOne!.mockResolvedValue({ id: 1 });

      const result = await service.getProfile(5, 'jane');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'jane' },
      });
      expect(followRepository.findOne).toHaveBeenCalledWith({
        where: { followerId: 5, followingId: profileUser.id },
      });
      expect(result.following).toBe(true);
    });

    it('returns following=false for unauthenticated viewer without querying follows', async () => {
      userRepository.findOne!.mockResolvedValue(buildUser());

      const result = await service.getProfile(null, 'jane');

      expect(followRepository.findOne).not.toHaveBeenCalled();
      expect(result.following).toBe(false);
    });

    it('throws 404 when the profile user does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(service.getProfile(1, 'ghost')).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
        response: { errors: { user: ['not found'] } },
      });
    });
  });

  describe('followProfile', () => {
    it('creates a follow relation and returns following=true', async () => {
      const target = buildUser({ id: 20 });
      userRepository.findOne!.mockResolvedValue(target);
      followRepository.findOne!.mockResolvedValue(null);

      const result = await service.followProfile(5, 'jane');

      expect(followRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ followerId: 5, followingId: 20 }),
      );
      expect(result.following).toBe(true);
    });

    it('throws when current user tries to follow themselves', async () => {
      const target = buildUser({ id: 5 });
      userRepository.findOne!.mockResolvedValue(target);

      await expect(service.followProfile(5, 'jane')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        response: { errors: { user: ['cannot follow yourself'] } },
      });
      expect(followRepository.save).not.toHaveBeenCalled();
    });

    it('throws when already following', async () => {
      userRepository.findOne!.mockResolvedValue(buildUser({ id: 20 }));
      followRepository.findOne!.mockResolvedValue({ id: 99 });

      await expect(service.followProfile(5, 'jane')).rejects.toMatchObject({
        response: { errors: { profile: ['already following this user'] } },
      });
      expect(followRepository.save).not.toHaveBeenCalled();
    });

    it('throws 404 when the target user does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(service.followProfile(5, 'ghost')).rejects.toBeInstanceOf(
        HttpException,
      );
    });
  });

  describe('unfollowProfile', () => {
    it('deletes the follow relation and returns following=false', async () => {
      const target = buildUser({ id: 20 });
      userRepository.findOne!.mockResolvedValue(target);
      followRepository.findOne!.mockResolvedValue({ id: 99 });

      const result = await service.unfollowProfile(5, 'jane');

      expect(followRepository.delete).toHaveBeenCalledWith({
        followerId: 5,
        followingId: 20,
      });
      expect(result.following).toBe(false);
    });

    it('throws when current user tries to unfollow themselves', async () => {
      userRepository.findOne!.mockResolvedValue(buildUser({ id: 5 }));

      await expect(service.unfollowProfile(5, 'jane')).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
      });
    });

    it('throws when not currently following', async () => {
      userRepository.findOne!.mockResolvedValue(buildUser({ id: 20 }));
      followRepository.findOne!.mockResolvedValue(null);

      await expect(service.unfollowProfile(5, 'jane')).rejects.toMatchObject({
        response: { errors: { profile: ['you are not following this user'] } },
      });
      expect(followRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('buildProfileResponse', () => {
    it('returns only the public profile fields', () => {
      const profile = {
        ...buildUser(),
        following: true,
      };

      expect(service.buildProfileResponse(profile)).toEqual({
        profile: {
          username: profile.username,
          bio: profile.bio,
          image: profile.image,
          following: true,
        },
      });
    });
  });
});
