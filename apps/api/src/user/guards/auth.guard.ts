import { ExpressRequest } from '@app/types/expressRequest.interface';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ExceptionService } from '@app/shared/services/exception.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly exceptionService: ExceptionService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest<ExpressRequest>();

    if (request.user) {
      return true;
    }

    this.exceptionService.throwHttpException(
      'auth',
      'not authorized',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
