import { Controller, Get, Query, UseFilters } from '@nestjs/common';
import { AppService } from './app.service';
import { GenericErrorFilter } from './genericRpcError';
import {
  GetPoolAndTokenVolumesReply,
  GetPoolAndTokenVolumesRequest,
  GetTokenDetailsReply,
  GetTokenDetailsRequest,
  GetTvlReply,
  GetTvlRequest,
  HealthCheckReply,
} from './interfaces/IController';

@Controller()
@UseFilters(new GenericErrorFilter())
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('tvl')
  async getTvl(@Query() req: GetTvlRequest): Promise<GetTvlReply> {
    return await this.appService.getTvl(req);
  }

  @Get('pool-token-volumes')
  async getPoolAndTokenVolumes(
    @Query() req: GetPoolAndTokenVolumesRequest,
  ): Promise<GetPoolAndTokenVolumesReply> {
    return await this.appService.getPoolAndTokenVolumes(req);
  }

  @Get('token-detail')
  async getTokenDetails(
    @Query() req: GetTokenDetailsRequest,
  ): Promise<GetTokenDetailsReply> {
    return await this.appService.getTokenDetails(req);
  }

  @Get('health-check')
  async heathCheck(req): Promise<HealthCheckReply> {
    return { run: true };
  }
}
