import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import {
  GetTvlRequest,
  GetTvlReply,
  GetTokenDetailsReply,
  GetTokenDetailsRequest,
} from './generated/dappradar-proto/defi-providers';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod('DefiProviders', 'GetTvl')
  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    return await this.appService.getTvl(req);
  }

  @GrpcMethod('DefiProviders', 'GetTokenDetails')
  async getTokenDetails(
    req: GetTokenDetailsRequest,
  ): Promise<GetTokenDetailsReply> {
    return await this.appService.getTokenDetails(req);
  }
}
