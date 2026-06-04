import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProfileResponseInterface } from '@app/profile/types/profileResponse.interfaces';
import { ProfileService } from '@app/profile/profile.service';
import { User } from '@app/user/decorators/user.decorator';
import { AuthGuard } from '@app/user/guards/auth.guard';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('profiles')
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':username')
  @ApiOperation({
    summary: 'Get profile',
    description:
      'Returns a user profile by username and includes whether the current user follows it when authenticated.',
  })
  @ApiParam({
    name: 'username',
    description: 'Profile username.',
    example: 'john_doe',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile returned.',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile user was not found.',
  })
  async getProfile(
    @User('id') currentUserId: number,
    @Param('username') profileUsername: string,
  ): Promise<ProfileResponseInterface> {
    const profile = await this.profileService.getProfile(
      currentUserId,
      profileUsername,
    );

    return this.profileService.buildProfileResponse(profile);
  }

  @Post(':username/follow')
  @ApiOperation({
    summary: 'Follow profile',
    description: 'Makes the authenticated user follow the selected profile.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiParam({
    name: 'username',
    description: 'Profile username to follow.',
    example: 'john_doe',
  })
  @ApiResponse({
    status: 201,
    description: 'Profile followed and returned.',
  })
  @ApiResponse({
    status: 400,
    description: 'Profile cannot be followed in the current state.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile user was not found.',
  })
  async followProfile(
    @User('id') currentUserId: number,
    @Param('username') profileUsername: string,
  ): Promise<ProfileResponseInterface> {
    const profile = await this.profileService.followProfile(
      currentUserId,
      profileUsername,
    );

    return this.profileService.buildProfileResponse(profile);
  }

  @Delete(':username/follow')
  @ApiOperation({
    summary: 'Unfollow profile',
    description:
      'Makes the authenticated user stop following the selected profile.',
  })
  @UseGuards(AuthGuard)
  @ApiSecurity('Token')
  @ApiParam({
    name: 'username',
    description: 'Profile username to unfollow.',
    example: 'john_doe',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile unfollowed and returned.',
  })
  @ApiResponse({
    status: 400,
    description: 'Profile cannot be unfollowed in the current state.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid authorization token.',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile user was not found.',
  })
  async unfollowProfile(
    @User('id') currentUserId: number,
    @Param('username') profileUsername: string,
  ): Promise<ProfileResponseInterface> {
    const profile = await this.profileService.unfollowProfile(
      currentUserId,
      profileUsername,
    );

    return this.profileService.buildProfileResponse(profile);
  }
}
