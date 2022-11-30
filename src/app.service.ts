import { Injectable } from '@nestjs/common';
import {
  GetTvlQuery,
  GetTvlReply,
} from './generated/dappradar-proto/defi-providers';
import { DappsService } from './dapps/dapps.service';

@Injectable()
export class AppService {
  constructor(private readonly dappsService: DappsService) {}

  async getTvl(
    provider: string,
    chain: string | undefined,
    query: GetTvlQuery,
  ): Promise<GetTvlReply> {
    const { block, date } = query;

    return await this.dappsService.getTvl(provider, chain, block, date);
  }
}
