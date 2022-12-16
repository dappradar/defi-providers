import { sendLog } from './util/logger';
import { Observable, throwError } from 'rxjs';
import {
  ArgumentsHost,
  Catch,
  HttpStatus,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
@Catch()
export class GenericRpcErrorFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToRpc();

    const errorResponse: any = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      errorName: exception?.name,
      message: exception?.message,
      requestData: ctx.getData(),
    };

    sendLog({
      message: errorResponse.message,
      detail: errorResponse.errorResponsestatusCode,
      endpoint: errorResponse.errorName,
      level: 'Error',
    });
    return throwError(() => errorResponse);
  }
}
