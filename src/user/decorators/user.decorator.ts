import { ExpressRequest } from '@app/types/expressRequest.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '@app/user/user.entity';

export const User = createParamDecorator(
  (data: keyof UserEntity | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ExpressRequest>();

    if (!request.user) {
      return null;
    }
    if (data) {
      return request.user[data];
    }

    return request.user;
  },
);
