import { log } from './util/logger/logger';
import { Observable, throwError } from 'rxjs';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
@Catch()
export class GenericErrorFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToHttp();
    const errorResponse: any = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      errorName: exception?.name,
      message: exception?.message,
      requestData: JSON.stringify(ctx.getRequest().query),
    };

    log.error({
      message: errorResponse?.message,
      stack: exception?.stack || '',
      detail: errorResponse?.errorResponsestatusCode,
      endpoint: ctx.getRequest().url,
    });
    return throwError(() => errorResponse);
  }
}
