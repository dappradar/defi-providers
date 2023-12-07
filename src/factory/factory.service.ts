import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import {
  GetPoolAndTokenVolumesReply,
  GetPoolAndTokenVolumesRequest,
  GetTvlReply,
  GetTvlRequest,
  PoolVolume,
  TokenVolume,
} from '../interfaces/IController';

import { RpcException } from '@nestjs/microservices';
import { Web3ProviderService } from '../web3Provider/web3Provider.service';
import { log } from '../util/logger/logger';
import basicUtil from '../util/basicUtil';
import { config, nodeUrls } from '../app.config';

import * as autointegration from '../util/autointegration';

interface IProvider {
  tvl: ({ web3, block, chain, provider, date }) => Promise<GetTvlReply>;
  getPoolVolumes: ({ web3, block, chain, provider, pools }) => Promise<{
    [key: string]: PoolVolume;
  }>;
  getTokenVolumes: ({ web3, block, chain, provider, tokens }) => Promise<{
    [key: string]: TokenVolume;
  }>;
}

@Injectable()
export class FactoryService {
  constructor(private readonly web3ProviderService: Web3ProviderService) {}
  async getTvl(
    req: GetTvlRequest,
    timeoutErrorCount = 0,
  ): Promise<GetTvlReply> {
    if (req.block === undefined) {
      throw new RpcException('Block is undefined');
    }
    if (this.web3ProviderService.checkNodeUrl(req?.chain)) {
      throw new RpcException('Node URL is not provided');
    }

    const block = parseInt(req.block) - basicUtil.getDelay(req.chain);
    const web3 = await this.web3ProviderService.getWeb3(req?.chain);
    let tvlData;
    console.log('req', req);

    if (
      req?.autointegrationParams?.autointegrated === 'false' ||
      req?.autointegrationParams?.autointegrated === undefined
    ) {
      const providerService: IProvider = await import(
        this.getProviderServicePath(req.chain, req.provider, 'index')
      );
      tvlData = await providerService.tvl({
        web3,
        chain: req?.chain,
        provider: req?.provider,
        block,
        date: req?.date,
      });
    } else {
      tvlData = await autointegration.tvl({
        web3,
        chain: req?.chain,
        provider: req?.provider,
        block,
        date: req?.date,
        dappType: req?.autointegrationParams?.dappType,
        addresses: req?.autointegrationParams?.addresses,
      });
    }

    const balances = basicUtil.checkZeroBalance(tvlData.balances);
    return { balances, poolBalances: tvlData.poolBalances };
  }

  async getPoolAndTokenVolumes(
    req: GetPoolAndTokenVolumesRequest,
  ): Promise<GetPoolAndTokenVolumesReply> {
    if (req.block === undefined) {
      throw new RpcException('Block is undefined');
    }
    if (this.web3ProviderService.checkNodeUrl(req?.chain)) {
      throw new RpcException('Node URL is not provided');
    }

    const providerService: IProvider = await import(
      this.getProviderServicePath(req.chain, req.provider, 'index')
    );

    const block = parseInt(req.block) - basicUtil.getDelay(req.chain);
    const web3 = await this.web3ProviderService.getWeb3(req?.chain);

    const poolVolumes = await providerService.getPoolVolumes({
      web3,
      chain: req.chain,
      provider: req.provider,
      block,
      pools: req.pools,
    });
    for (const [, poolVolume] of Object.entries(poolVolumes)) {
      poolVolume.volumes = poolVolume.volumes.map((volume) =>
        BigNumber(volume).toFixed(),
      );
      poolVolume.volumeUsd = BigNumber(poolVolume.volumeUsd).toFixed(2);
    }

    const tokenVolumes = await providerService.getTokenVolumes({
      web3,
      chain: req.chain,
      provider: req.provider,
      block,
      tokens: req.tokens,
    });
    for (const [, tokenVolume] of Object.entries(tokenVolumes)) {
      tokenVolume.volume = BigNumber(tokenVolume.volume).toFixed();
      tokenVolume.volumeUsd = BigNumber(tokenVolume.volumeUsd).toFixed(2);
    }

    return { poolVolumes, tokenVolumes };
  }

  getProviderServicePath(
    chain: string,
    provider: string,
    path: string,
  ): string {
    return `${__dirname}/providers/${chain}/${provider}/${path}`;
  }
}
