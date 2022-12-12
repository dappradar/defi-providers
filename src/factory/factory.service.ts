import { Injectable, OnModuleInit } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import {
  GetTvlRequest,
  GetTvlReply,
  GetPoolAndTokenVolumesRequest,
  GetPoolAndTokenVolumesReply,
  PoolVolume,
  TokenVolume,
  GetTokenDetailsRequest,
  GetTokenDetailsReply,
} from '../generated/dappradar-proto/defi-providers';
import { RpcException } from '@nestjs/microservices';
import { Web3ProviderService } from '../web3Provider/web3Provider.service';

interface IProvider {
  tvl: ({ web3, block, chain, provider, date }) => Promise<GetTvlReply>;
  getPoolVolumes: ({ block, chain, provider, pools }) => Promise<{
    [key: string]: PoolVolume;
  }>;
  getTokenVolumes: ({ block, chain, provider, tokens }) => Promise<{
    [key: string]: TokenVolume;
  }>;
}

@Injectable()
export class FactoryService implements OnModuleInit {
  async onModuleInit() {
    // await this.getTvl({
    //   provider: 'kolibri',
    //   chain: 'tezos',
    //   query: { block: '1330100', date: '0' },
    // });
    //
    // await this.getTvl({
    //   provider: 'linear',
    //   chain: 'near',
    //   query: { block: '61157983', date: '0' },
    // });
    console.log(
      await this.getTvl({
        provider: 'pooltogether',
        chain: 'ethereum',
        query: { block: '16168000', date: '0' },
      }),
    );
  }
  constructor(private readonly web3ProviderService: Web3ProviderService) {}

  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    if (req.query.block === undefined) {
      throw new RpcException('Block is undefined');
    }

    const providerService: IProvider = await import(
      this.getProviderServicePath(req.chain, req.provider)
    );
    const tvlData = await providerService.tvl({
      web3: await this.web3ProviderService.getWeb3(req?.chain),
      chain: req?.chain,
      provider: req?.provider,
      block: parseInt(req.query?.block),
      date: req.query?.date,
    });

    return { balances: tvlData.balances, poolBalances: tvlData.poolBalances };
  }

  async getPoolAndTokenVolumes(
    req: GetPoolAndTokenVolumesRequest,
  ): Promise<GetPoolAndTokenVolumesReply> {
    if (req.query.block === undefined) {
      throw new RpcException('Block is undefined');
    }

    const providerService: IProvider = await import(
      this.getProviderServicePath(req.chain, req.provider)
    );

    const poolVolumes = await providerService.getPoolVolumes({
      chain: req.chain,
      provider: req.provider,
      block: parseInt(req.query.block),
      pools: req.query.pools,
    });
    for (const [, poolVolume] of Object.entries(poolVolumes)) {
      poolVolume.volumes = poolVolume.volumes.map((volume) =>
        BigNumber(volume).toFixed(),
      );
      poolVolume.volumeUsd = BigNumber(poolVolume.volumeUsd).toFixed(2);
    }

    const tokenVolumes = await providerService.getTokenVolumes({
      chain: req.chain,
      provider: req.provider,
      block: parseInt(req.query.block),
      tokens: req.query.tokens,
    });
    for (const [, tokenVolume] of Object.entries(tokenVolumes)) {
      tokenVolume.volume = BigNumber(tokenVolume.volume).toFixed();
      tokenVolume.volumeUsd = BigNumber(tokenVolume.volumeUsd).toFixed(2);
    }

    return { poolVolumes, tokenVolumes };
  }

  async getTokenDetails(
    req: GetTokenDetailsRequest,
  ): Promise<GetTokenDetailsReply> {
    const { address, name, symbol, decimals, logo } = await import(
      this.getProviderServicePath(req.chain, req.provider)
    );
    return { address, name, symbol, decimals, logo };
  }

  getProviderServicePath(chain: string, provider: string): string {
    return `./providers/${chain}/${provider}/index`;
  }
}
