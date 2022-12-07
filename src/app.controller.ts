import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  GetTvlRequest,
  GetTvlReply,
  GetPoolAndTokenVolumesRequest,
  GetPoolAndTokenVolumesReply,
} from './generated/dappradar-proto/defi-providers';

@Controller()
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
}
