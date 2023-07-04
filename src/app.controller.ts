import { Body, Controller, Get, Post, Query, UseFilters } from '@nestjs/common';
import { AppService } from './app.service';
import { GenericErrorFilter } from './genericErrorFilter';
import {
  GetPoolAndTokenVolumesReply,
  GetPoolAndTokenVolumesRequest,
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

  @Post('pool-token-volumes')
  async getPoolAndTokenVolumes(
    @Body() req: GetPoolAndTokenVolumesRequest,
  ): Promise<GetPoolAndTokenVolumesReply> {
    return await this.appService.getPoolAndTokenVolumes(req);
  }

  @Get('health-check')
  async heathCheck(req): Promise<HealthCheckReply> {
    return { run: true };
  }
}
