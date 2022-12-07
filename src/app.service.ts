import { Injectable } from '@nestjs/common';
import {
  GetTvlRequest,
  GetTvlReply,
  GetTokenDetailsRequest,
  GetTokenDetailsReply,
} from './generated/dappradar-proto/defi-providers';
import { FactoryService } from './factory/factory.service';

@Injectable()
export class AppService {
  constructor(private readonly factoryService: FactoryService) {}

  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    return await this.factoryService.getTvl(req);
  }

  async getTokenDetails(
    req: GetTokenDetailsRequest,
  ): Promise<GetTokenDetailsReply> {
    return await this.factoryService.getTokenDetails(req);
  }
}
