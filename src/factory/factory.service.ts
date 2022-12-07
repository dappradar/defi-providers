import { Injectable } from '@nestjs/common';
import {
  GetTvlRequest,
  GetTvlReply,
  GetTokenDetailsRequest,
  GetTokenDetailsReply,
} from '../generated/dappradar-proto/defi-providers';
interface IProvider {
  tvl: ({ block, chain, provider, date }) => GetTvlReply;
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
      `./providers/${req.chain}/${req.provider}/index`
    );

    const tvlData = await providerService.tvl({
      chain: req?.chain,
      provider: req?.provider,
      block: parseInt(req.query?.block),
      date: req.query?.date,
    });
    console.log(tvlData);
    return { balances: tvlData.balances, poolBalances: tvlData.poolBalances };
  }

  async getTokenDetails(
    req: GetTokenDetailsRequest,
  ): Promise<GetTokenDetailsReply> {
    const { address, name, symbol, decimals, logo } = await import(
      `./providers/${req.chain}/${req.provider}/data.json`
    );
    return { address, name, symbol, decimals, logo };
  }
}
