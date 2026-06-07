import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FollowEntity } from '@app/profile/follow.entity';
import { ProfileController } from '@app/profile/profile.controller';
import { ProfileService } from '@app/profile/profile.service';
import { SharedModule } from '@app/shared/shared.module';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UserEntity } from '@app/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FollowEntity]), SharedModule],
  controllers: [ProfileController],
  providers: [ProfileService, AuthGuard],
})
export class ProfileModule {}
