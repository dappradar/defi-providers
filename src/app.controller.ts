import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  GetTvlRequest,
  GetTvlReply,
} from './generated/dappradar-proto/defi-providers';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod('DefiProviders', 'GetTvl')
  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    const tvl = await this.appService.getTvl(
      req.provider,
      req.chain,
      req.query,
    );
    return tvl;
  }
}
