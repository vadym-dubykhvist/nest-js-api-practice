import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

export type ErrorResponse = {
  errors: Record<string, string[]>;
};

@Injectable()
export class ExceptionService {
  throwHttpException(
    errorKey: string,
    errorMessage: string,
    status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
  ): never {
    throw new HttpException(
      this.buildErrorResponse(errorKey, errorMessage),
      status,
    );
  }

  throwHttpExceptionWithErrors(
    errors: Record<string, string[]>,
    status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
  ): never {
    throw new HttpException(this.buildErrorsResponse(errors), status);
  }

  buildErrorResponse(errorKey: string, errorMessage: string): ErrorResponse {
    return {
      errors: {
        [errorKey]: [errorMessage],
      },
    };
  }

  buildErrorsResponse(errors: Record<string, string[]>): ErrorResponse {
    return { errors };
  }
}
