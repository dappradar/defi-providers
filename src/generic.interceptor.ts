import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { log } from './util/logger/logger';

@Injectable()
export class GenericInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const endpoint = context.getHandler();

    return next.handle().pipe(
      tap({
        next: (value) => {
          log.info({
            message:
              endpoint.name == 'getPoolAndTokenVolumes'
                ? ''
                : JSON.stringify(req.query),
            endpoint: endpoint.name,
          });
        },
        error: (err: Error) => {
          log.error({
            message: err?.message,
            stack: err?.stack || '',
            detail: err?.name,
            endpoint: endpoint.name,
          });
        },
      }),
    );
  }
}
