import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { ArticleModule } from '@app/article/article.module';
import { CommentModule } from '@app/comment/comment.module';
import { EventModule } from '@app/event/event.module';
import { HealthModule } from '@app/health/health.module';
import { MetricsModule } from '@app/metrics/metrics.module';
import ormconfig from '@app/ormconfig';
import { ProfileModule } from '@app/profile/profile.module';
import { createGlobalValidationPipe } from '@app/shared/pipes/global-validation.pipe';
import { TagModule } from '@app/tag/tag.module';
import { AuthMiddleware } from '@app/user/middlewares/auth.middleware';
import { UserModule } from '@app/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env.local', isGlobal: true }),
    TypeOrmModule.forRoot(ormconfig),
    TagModule,
    UserModule,
    ArticleModule,
    ProfileModule,
    CommentModule,
    EventModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useFactory: createGlobalValidationPipe },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
