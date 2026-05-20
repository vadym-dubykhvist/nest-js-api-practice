import { Module } from '@nestjs/common';
import { ArticleController } from '@app/article/article.controller';
import { ArticleService } from '@app/article/article.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from '@app/article/article.entity';
import { UserEntity } from '@app/user/user.entity';
import { FollowEntity } from '@app/profile/follow.entity';
import { EventEntity } from '@app/event/event.entity';
import { SharedModule } from '@app/shared/shared.module';
import { AuthGuard } from '@app/user/guards/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticleEntity,
      UserEntity,
      FollowEntity,
      EventEntity,
    ]),
    SharedModule,
  ],
  controllers: [ArticleController],
  providers: [ArticleService, AuthGuard],
})
export class ArticleModule {}
