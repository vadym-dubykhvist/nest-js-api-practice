import { Module } from '@nestjs/common';
import { ExceptionService } from '@app/shared/services/exception.service';

@Module({
  providers: [ExceptionService],
  exports: [ExceptionService],
})
export class SharedModule {}
