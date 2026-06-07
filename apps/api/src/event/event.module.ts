import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventController } from '@app/event/event.controller';
import { EventEntity } from '@app/event/event.entity';
import { EventService } from '@app/event/event.service';
import { EventRatingEntity } from '@app/event/eventRating.entity';
import { RegistrationEntity } from '@app/event/registration.entity';
import { SharedModule } from '@app/shared/shared.module';
import { TagEntity } from '@app/tag/tag.entity';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UserEntity } from '@app/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      RegistrationEntity,
      EventRatingEntity,
      UserEntity,
      TagEntity,
    ]),
    SharedModule,
  ],
  controllers: [EventController],
  providers: [EventService, AuthGuard],
})
export class EventModule {}
