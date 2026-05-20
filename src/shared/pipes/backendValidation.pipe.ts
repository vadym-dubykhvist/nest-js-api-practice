import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  ValidationError,
} from '@nestjs/common';
import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ExceptionService } from '@app/shared/services/exception.service';

@Injectable()
export class BackendValidationPipe implements PipeTransform {
  constructor(
    private readonly exceptionService: ExceptionService = new ExceptionService(),
  ) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<unknown> {
    if (!metadata.metatype) return value;

    const primitiveTypes: unknown[] = [String, Boolean, Number, Array, Object];
    if (primitiveTypes.includes(metadata.metatype)) return value;

    const object = plainToClass(
      metadata.metatype as ClassConstructor<object>,
      value ?? {},
    );
    const errors = await validate(object, { forbidUnknownValues: false });

    if (errors.length === 0) return value;

    this.exceptionService.throwHttpExceptionWithErrors(
      this.formatErrors(errors),
    );
  }

  formatErrors(errors: ValidationError[]): Record<string, string[]> {
    return errors.reduce((acc, err) => {
      acc[err.property] = Object.values(err.constraints ?? {});
      return acc;
    }, {});
  }
}
