import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventEntity } from '@app/event/event.entity';
import { RegistrationEntity } from '@app/event/registration.entity';
import { EventRatingEntity } from '@app/event/eventRating.entity';
import { UserEntity } from '@app/user/user.entity';
import { SharedModule } from '@app/shared/shared.module';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { EventController } from '@app/event/event.controller';
import { EventService } from '@app/event/event.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventEntity,
      RegistrationEntity,
      EventRatingEntity,
      UserEntity,
    ]),
    SharedModule,
  ],
  controllers: [EventController],
  providers: [EventService, AuthGuard],
})
export class EventModule {}
