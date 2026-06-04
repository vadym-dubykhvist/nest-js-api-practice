import { HttpStatus, Injectable } from '@nestjs/common';
import type { ProfileResponseInterface } from '@app/profile/types/profileResponse.interfaces';
import { ProfileType } from '@app/profile/types/profile.types';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/user/user.entity';
import { Repository } from 'typeorm';
import { FollowEntity } from '@app/profile/follow.entity';
import { ExceptionService } from '@app/shared/services/exception.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
    private readonly exceptionService: ExceptionService,
  ) {}

  async getProfile(
    currentUserId: number | null,
    profileUsername: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({
      where: { username: profileUsername },
    });

    if (!user) {
      this.exceptionService.throwHttpException(
        'user',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const follow =
      currentUserId !== null
        ? !!(await this.followRepository.findOne({
            where: {
              followerId: currentUserId,
              followingId: user.id,
            },
          }))
        : false;

    return {
      ...user,
      following: follow,
    };
  }

  async followProfile(
    currentUserId: number,
    profileUsername: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({
      where: { username: profileUsername },
    });

    if (!user) {
      this.exceptionService.throwHttpException(
        'user',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (currentUserId === user.id) {
      this.exceptionService.throwHttpException(
        'user',
        'cannot follow yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: currentUserId,
        followingId: user.id,
      },
    });

    if (follow) {
      this.exceptionService.throwHttpException(
        'profile',
        'already following this user',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!follow) {
      const followToCreate = new FollowEntity();
      followToCreate.followerId = currentUserId;
      followToCreate.followingId = user.id;
      await this.followRepository.save(followToCreate);
    }

    return {
      ...user,
      following: true,
    };
  }

  async unfollowProfile(
    currentUserId: number,
    profileUsername: string,
  ): Promise<ProfileType> {
    const user = await this.userRepository.findOne({
      where: { username: profileUsername },
    });

    if (!user) {
      this.exceptionService.throwHttpException(
        'user',
        'not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (currentUserId === user.id) {
      this.exceptionService.throwHttpException(
        'user',
        'cannot follow yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    const follow = await this.followRepository.findOne({
      where: {
        followerId: currentUserId,
        followingId: user.id,
      },
    });

    if (!follow) {
      this.exceptionService.throwHttpException(
        'profile',
        'you are not following this user',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (follow) {
      await this.followRepository.delete({
        followerId: currentUserId,
        followingId: user.id,
      });
    }

    return {
      ...user,
      following: false,
    };
  }

  buildProfileResponse(profile: ProfileType): ProfileResponseInterface {
    return {
      profile: {
        username: profile.username,
        bio: profile.bio,
        image: profile.image,
        following: profile.following,
      },
    };
  }
}
