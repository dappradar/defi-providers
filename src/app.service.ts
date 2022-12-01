import { Injectable } from '@nestjs/common';
import {
  GetTvlRequest,
  GetTvlReply,
} from './generated/dappradar-proto/defi-providers';
import { DappsService } from './dapps/dapps.service';

@Injectable()
export class AppService {
  constructor(private readonly dappsService: DappsService) {}

  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    return await this.dappsService.getTvl(req);
  }
}
