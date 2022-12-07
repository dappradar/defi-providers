import {
  Controller,
  ArgumentsHost,
  Catch,
  RpcExceptionFilter,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import {
  GetTvlRequest,
  GetTvlReply,
  GetPoolAndTokenVolumesRequest,
  GetPoolAndTokenVolumesReply,
  GetTokenDetailsReply,
  GetTokenDetailsRequest,
} from './generated/dappradar-proto/defi-providers';
import * as logger from './logger';
import { Observable, throwError } from 'rxjs';

@Catch()
export class GenericRpcErrorFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToRpc();

    const errorResponse: any = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      errorName: exception?.name,
      message: exception?.message,
      requestData: JSON.stringify(ctx.getData(), null, 4),
    };

    logger.error(errorResponse);
    return throwError(() => errorResponse);
  }
}

@Controller()
@UseFilters(new GenericRpcErrorFilter())
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod('DefiProviders', 'GetTvl')
  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    if (req.query.block === undefined) {
      throw new RpcException('Block is undefined');
    }
    return await this.appService.getTvl(req);
  }

  @GrpcMethod('DefiProviders', 'GetPoolAndTokenVolumes')
  async getPoolAndTokenVolumes(
    req: GetPoolAndTokenVolumesRequest,
  ): Promise<GetPoolAndTokenVolumesReply> {
    if (req.query.block === undefined) {
      throw new RpcException('Block is undefined');
    }
    return await this.appService.getPoolAndTokenVolumes(req);
  }

  @GrpcMethod('DefiProviders', 'GetTokenDetails')
  async getTokenDetails(
    req: GetTokenDetailsRequest,
  ): Promise<GetTokenDetailsReply> {
    return await this.appService.getTokenDetails(req);
  }
}
