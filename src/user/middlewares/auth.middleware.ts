import { ExpressRequest } from '@app/types/expressRequest.interface';
import { NestMiddleware, Injectable } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { UserService } from '@app/user/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}
  async use(req: ExpressRequest, _: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;
      next();
      return;
    }

    const token = req.headers.authorization.split(' ')[1];

    try {
      const decoded = verify(token, process.env.JWT_SECRET!);
      if (typeof decoded === 'string' || !decoded.id) {
        req.user = null;
        next();
        return;
      }
      const user = await this.userService.findById(decoded.id as number);
      req.user = user;
      next();
    } catch {
      req.user = null;
      next();
    }
  }
}
