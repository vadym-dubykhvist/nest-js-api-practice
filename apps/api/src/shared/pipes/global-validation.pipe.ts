import {
  HttpException,
  HttpStatus,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

/** Same shape as ExceptionService: `{ errors: { field: [messages] } }`. */
function formatErrors(errors: ValidationError[]): Record<string, string[]> {
  return errors.reduce<Record<string, string[]>>((acc, error) => {
    acc[error.property] = Object.values(error.constraints ?? {});
    return acc;
  }, {});
}

/**
 * One global pipe that both validates DTOs and transforms payloads — notably
 * coercing query-string numbers (limit/offset) into actual numbers via each
 * DTO's `@Type(() => Number)`. Errors keep the project's `{ errors }` 422 shape,
 * so it fully replaces the per-route BackendValidationPipe.
 */
export function createGlobalValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) =>
      new HttpException(
        { errors: formatErrors(errors) },
        HttpStatus.UNPROCESSABLE_ENTITY,
      ),
  });
}
