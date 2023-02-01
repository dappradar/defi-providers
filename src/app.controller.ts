import { Controller, UseFilters } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  GetTvlRequest,
  GetTvlReply,
  GetPoolAndTokenVolumesRequest,
  GetPoolAndTokenVolumesReply,
  GetTokenDetailsReply,
  GetTokenDetailsRequest,
  HeathCheckRequest,
  HeathCheckReply,
} from './generated/proto/defi-providers';
import { GenericRpcErrorFilter } from './genericRpcError';

@Controller()
@UseFilters(new GenericRpcErrorFilter())
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod('DefiProviders', 'GetTvl')
  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    return await this.appService.getTvl(req);
  }

  @GrpcMethod('DefiProviders', 'GetPoolAndTokenVolumes')
  async getPoolAndTokenVolumes(
    req: GetPoolAndTokenVolumesRequest,
  ): Promise<GetPoolAndTokenVolumesReply> {
    return await this.appService.getPoolAndTokenVolumes(req);
  }

  @GrpcMethod('DefiProviders', 'GetTokenDetails')
  async getTokenDetails(
    req: GetTokenDetailsRequest,
  ): Promise<GetTokenDetailsReply> {
    return await this.appService.getTokenDetails(req);
  }

  @GrpcMethod('DefiProviders', 'HeathCheck')
  async heathCheck(req: HeathCheckRequest): Promise<HeathCheckReply> {
    console.log('heath check');
    return { run: true };
  }
}
