import { log } from './util/logger/logger';
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

    log.error({
      message: errorResponse?.message,
      stack: exception?.stack || '',
      detail: errorResponse?.errorResponsestatusCode,
      endpoint: `path: ${host.getArgs()[2]?.call?.handler?.path} chain: ${
        ctx.getData()?.chain
      } provider: ${ctx.getData()?.provider}`,
    });
    return throwError(() => errorResponse);
  }
}
