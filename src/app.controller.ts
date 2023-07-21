import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseFilters,
  HttpException,
} from '@nestjs/common';
import { AppService } from './app.service';
import {
  GetPoolAndTokenVolumesReply,
  GetPoolAndTokenVolumesRequest,
  GetTvlReply,
  GetTvlRequest,
  HealthCheckReply,
} from './interfaces/IController';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('tvl')
  async getTvl(@Query() req: GetTvlRequest): Promise<GetTvlReply> {
    try {
      return await this.appService.getTvl(req);
    } catch (e) {
      throw new HttpException(e.message, 500);
    }
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
