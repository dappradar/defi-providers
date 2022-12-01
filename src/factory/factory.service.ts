import { Injectable } from '@nestjs/common';
import {
  GetTvlRequest,
  GetTvlReply,
} from '../generated/dappradar-proto/defi-providers';
interface IProvider {
  tvl: ({
    block,
    chain,
    provider,
    date,
  }) => { balance: string } | { balance: string; poolBalances: string };
}

@Injectable()
export class FactoryService {
  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    console.log('provider', req.provider);
    console.log('chain', req.chain);
    console.log('block', req.query.block);
    console.log('date', req.query.date);

    // TO DO: check if chain exists
    //const chain = 'optimism' && data.CHAINS['optimism'] ? 'optimism' : 'ethereum';

    const providerService: IProvider = await import(
      req.chain === 'ethereum'
        ? `./providers/${req.provider}`
        : `./providers/${req.chain}_${req.provider}/index`
    );

    const tvlData = await providerService.tvl({
      chain: req.chain,
      provider: req.provider,
      block: parseInt(req.query.block),
      date: req.query.date,
    });
    console.log(tvlData);
    return tvlData;
  }
}
