import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ArticleController } from '@app/article/article.controller';
import { ArticleEntity } from '@app/article/article.entity';
import { ArticleService } from '@app/article/article.service';
import { EventEntity } from '@app/event/event.entity';
import { RegistrationEntity } from '@app/event/registration.entity';
import { FollowEntity } from '@app/profile/follow.entity';
import { SharedModule } from '@app/shared/shared.module';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UserEntity } from '@app/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticleEntity,
      UserEntity,
      FollowEntity,
      EventEntity,
      RegistrationEntity,
    ]),
    SharedModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService, AuthGuard],
})
export class ArticleModule {}
