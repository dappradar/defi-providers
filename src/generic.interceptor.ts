import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { sendLog } from './util/logger';

@Injectable()
export class GenericInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const endpoint = context.getHandler();
    sendLog({
      message: JSON.stringify(req),
      detail: null,
      endpoint: endpoint.name,
      level: 'Info',
    });
    return next.handle().pipe();
  }
}
