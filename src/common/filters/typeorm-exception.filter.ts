import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(
    exception: QueryFailedError & { code?: string; detail?: string },
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === '23505') {
      const message = exception.detail?.includes('email')
        ? 'Email already exists'
        : 'Unique constraint violated';
      response
        .status(409)
        .json({ statusCode: 409, message, error: 'Conflict' });
    } else {
      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });
    }
  }
}
