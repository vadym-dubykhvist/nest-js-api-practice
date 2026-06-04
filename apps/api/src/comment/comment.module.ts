import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommentEntity } from '@app/comment/comment.entity';
import { ArticleEntity } from '@app/article/article.entity';
import { UserEntity } from '@app/user/user.entity';
import { SharedModule } from '@app/shared/shared.module';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { CommentController } from '@app/comment/comment.controller';
import { CommentService } from '@app/comment/comment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity, ArticleEntity, UserEntity]),
    SharedModule,
  ],
  controllers: [CommentController],
  providers: [CommentService, AuthGuard],
})
export class CommentModule {}
