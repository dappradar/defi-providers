import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { log } from './util/logger/logger';

@Injectable()
export class GenericInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const endpoint = context.getHandler();
    log.info({
      message: JSON.stringify(req),
      endpoint: endpoint.name,
    });
    return next.handle().pipe();
  }
}
