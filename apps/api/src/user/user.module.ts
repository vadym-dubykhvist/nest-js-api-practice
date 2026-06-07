import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedModule } from '@app/shared/shared.module';
import { AuthGuard } from '@app/user/guards/auth.guard';
import { UserController } from '@app/user/user.controller';
import { UserEntity } from '@app/user/user.entity';
import { UserService } from '@app/user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), SharedModule],
  controllers: [UserController],
  providers: [UserService, AuthGuard],
  exports: [UserService],
})
export class UserModule {}
