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
} from '../generated/proto/defi-providers';
import { RpcException } from '@nestjs/microservices';
import { Web3ProviderService } from '../web3Provider/web3Provider.service';
import basicUtil from '../util/basicUtil';

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
export class FactoryService {
  constructor(private readonly web3ProviderService: Web3ProviderService) {}

  async getTvl(req: GetTvlRequest): Promise<GetTvlReply> {
    if (req.query.block === undefined) {
      throw new RpcException('Block is undefined');
    }
    if (this.web3ProviderService.checkNodeUrl(req?.chain)) {
      throw new RpcException('Node URL is not provided');
    }
    const providerService: IProvider = await import(
      this.getProviderServicePath(req.chain, req.provider, 'index')
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
      this.getProviderServicePath(req.chain, req.provider, 'index')
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
      this.getProviderServicePath(req.chain, req.provider, 'data.json')
    );
    return { address, name, symbol, decimals, logo };
  }

  getProviderServicePath(
    chain: string,
    provider: string,
    path: string,
  ): string {
    return `${__dirname}/providers/${chain}/${provider}/${path}`;
  }
}
