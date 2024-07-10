import BigNumber from 'bignumber.js';
import { PromisePool } from '@supercharge/promise-pool';
import { request, gql } from 'graphql-request';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { ITvlReturn } from '../../interfaces/ITvl';
import FACTORY_ABI from '../../constants/abi/factory.json';
import PAIR_ABI from '../../constants/abi/uni.json';
import RESERVES_ABI from '../../constants/abi/uniReserves.json';
import BULK_RESERVES_ABI from '../../constants/abi/bulkReserves.json';
import {
  BULK_RESERVES_ADDRESSES,
  BULK_RESERVES_DEPOLYED,
} from '../../constants/contracts.json';
import basicUtil from '../basicUtil';
import util from '../blockchainUtil';
import { log } from '../logger/logger';
import { retryAsyncFunction, retryPromiseAll } from '../retry';

async function getReserves(
  address: string,
  block: number,
  web3: Web3,
  chain: string,
  provider: string,
) {
  try {
    const contract = new web3.eth.Contract(PAIR_ABI as AbiItem[], address);
    const reserves = await contract.methods.getReserves().call(null, block);
    return {
      pool_address: address,
      reserve0: BigNumber(reserves._reserve0.toString()),
      reserve1: BigNumber(reserves._reserve1.toString()),
    };
  } catch (e) {
    try {
      const contract = new web3.eth.Contract(
        RESERVES_ABI as AbiItem[],
        address,
      );
      const reserves = await contract.methods.getReserves().call(null, block);
      return {
        pool_address: address,
        reserve0: BigNumber(reserves._reserve0.toString()),
        reserve1: BigNumber(reserves._reserve1.toString()),
      };
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: uniswapV2.getReserves chain: ${chain} provider: ${provider}`,
        endpoint: 'getReserves',
      });
    }
  }
  return {};
}

async function getPoolsReserves(
  bulk_reserves_contract: any,
  pInfos: string[],
  block: number,
  chain: string,
  web3: Web3,
  provider: string,
) {
  let poolReserves = [];
  try {
    if (
      block < BULK_RESERVES_DEPOLYED[chain] ||
      BULK_RESERVES_DEPOLYED[chain] === undefined
    ) {
      poolReserves = await Promise.all(
        pInfos.map((pool) =>
          retryAsyncFunction(
            getReserves,
            [pool, block, web3, chain, provider],
            { retries: 2 },
          ),
        ),
      );
    } else {
      try {
        poolReserves = await bulk_reserves_contract.methods
          .getReservesBulk(pInfos)
          .call(null, block);
      } catch (e) {
        try {
          poolReserves = await Promise.all(
            pInfos.map((pool) =>
              retryAsyncFunction(
                getReserves,
                [pool, block, web3, chain, provider],
                { retries: 2 },
              ),
            ),
          );
        } catch (e) {
          log.error({
            message: e?.message || '',
            stack: e?.stack || '',
            detail: `Error: inner getPoolsReserves chain: ${chain} provider: ${provider}`,
            endpoint: 'getPoolsReserves',
          });
        }
      }
    }
    return poolReserves;
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: out getPoolsReserves chain: ${chain} provider: ${provider}`,
      endpoint: 'getPoolsReserves',
    });
  }
  return poolReserves;
}

/**
 * Gets TVL of Uniswap V2 (or its clone) using factory address
 *
 * @param factoryAddress - The address of factory
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param provider - the provider folder name
 * @param web3 - The Web3 object
 * @param usePoolMethods - some factories use pool methods and other pair methods
 * @returns The object containing object with token addresses and their locked values and object with pool balances
 *
 */
async function getTvl(
  factoryAddress: string,
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
  usePoolMethods = false,
): Promise<ITvlReturn> {
  const balances = {};
  const poolBalances = {};

  let _pairs = [];
  let _token01 = {};
  try {
    _pairs = await basicUtil.readFromCache(
      `cache/${factoryAddress.toLowerCase()}_pairs.json`,
      chain,
      provider,
    );
  } catch {
    try {
      _pairs = await basicUtil.readFromCache(
        'cache/pairs.json',
        chain,
        provider,
      );
    } catch {}
  }
  try {
    _token01 = await basicUtil.readFromCache(
      `cache/${factoryAddress.toLowerCase()}_token01.json`,
      chain,
      provider,
    );
  } catch {
    try {
      _token01 = await basicUtil.readFromCache(
        'cache/token01.json',
        chain,
        provider,
      );
    } catch {}
  }
  const contract = new web3.eth.Contract(
    FACTORY_ABI as AbiItem[],
    factoryAddress,
  );

  const bulk_reserves_contract = new web3.eth.Contract(
    BULK_RESERVES_ABI as AbiItem[],
    BULK_RESERVES_ADDRESSES[chain],
  );

  let len = 0;
  try {
    if (!usePoolMethods) {
      len = await contract.methods.allPairsLength().call(null, block);
    } else {
      len = await contract.methods.allPoolsLength().call(null, block);
    }
    len = Number(len);
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: uniswapV2.getTvl of ${chain}/${provider}`,
      endpoint: 'usePoolMethods',
    });
    return;
  }

  log.info({
    message: `Pair counts: ${len}`,
    endpoint: 'getTvl',
  });

  let poolInfos = _pairs;
  const pairLength = _pairs.length;

  for (let start = pairLength; start < len; start += 300) {
    let pInfos: Promise<any>[] = [];
    const end = Math.min(start + 300, len);
    log.info({
      message: `Getting Pairs from ${start} to ${end}`,
      endpoint: 'getTvl',
    });
    for (let i = start; i < end; i++) {
      if (!usePoolMethods) {
        pInfos.push(contract.methods.allPairs(i).call());
      } else {
        pInfos.push(contract.methods.allPools(i).call());
      }
    }
    try {
      pInfos = await retryPromiseAll(pInfos, { retries: 2 });
      pInfos.forEach((info) => poolInfos.push(info));
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: uniswapV2.getTvl of ${chain}/${provider}`,
        endpoint: 'getTvl',
      });
      break;
    }
  }

  if (pairLength < len) {
    await basicUtil.saveIntoCache(
      poolInfos,
      `cache/${factoryAddress.toLowerCase()}_pairs.json`,
      chain,
      provider,
    );
  }

  poolInfos = poolInfos.slice(0, len);

  const token01Infos = _token01;
  const newPools = poolInfos.filter((info) => !_token01[info]);
  const newPoolLength = newPools.length;
  for (let start = 0; start < newPoolLength; start += 300) {
    const end = Math.min(newPoolLength, start + 300);
    log.info({
      message: `Getting Token01 from ${start} to ${end}`,
      endpoint: 'getTvl',
    });
    const subPools = newPools.slice(start, end);
    try {
      if (
        block < BULK_RESERVES_DEPOLYED[chain] ||
        BULK_RESERVES_DEPOLYED[chain] === undefined
      ) {
        const tokens0 = await util.executeCallOfMultiTargets(
          subPools,
          PAIR_ABI,
          'token0',
          [],
          block,
          chain,
          web3,
        );
        const tokens1 = await util.executeCallOfMultiTargets(
          subPools,
          PAIR_ABI,
          'token1',
          [],
          block,
          chain,
          web3,
        );
        subPools.forEach((subPool, index) => {
          token01Infos[subPool] = {};
          token01Infos[subPool].token0 = tokens0[index];
          token01Infos[subPool].token1 = tokens1[index];
        });
      } else {
        const tokens01 = await bulk_reserves_contract.methods
          .getToken01Bulk(subPools)
          .call();
        tokens01.forEach((token, index) => {
          if (token) {
            token01Infos[subPools[index]] = {};
            token01Infos[subPools[index]].token0 = token.token0.toLowerCase();
            token01Infos[subPools[index]].token1 = token.token1.toLowerCase();
          }
        });
      }
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Getting Token01 got issue at ${start}`,
        endpoint: 'getTvl',
      });
    }
  }

  await basicUtil.saveIntoCache(
    token01Infos,
    `cache/${factoryAddress.toLowerCase()}_token01.json`,
    chain,
    provider,
  );
  console.time('Getting PairInfo');
  for (let first = 0; first < poolInfos.length; first += 1500) {
    const last = Math.min(poolInfos.length, first + 1500);
    log.info({
      message: `Getting PairInfo from ${first} to ${last}`,
      endpoint: 'getTvl',
    });
    const getMultiPoolsReserves = [];
    for (let start = first; start < last; start += 50) {
      const end = Math.min(last, start + 50);
      getMultiPoolsReserves.push(
        getPoolsReserves(
          bulk_reserves_contract,
          poolInfos.slice(start, end),
          block,
          chain,
          web3,
          provider,
        ),
      );
    }

    const { results: poolReserves } = await PromisePool.withConcurrency(10)
      .for(getMultiPoolsReserves)
      .process(async (data) => {
        return data;
      });

    poolReserves.forEach((reserves) => {
      reserves.forEach((reserve) => {
        poolBalances[reserve.pool_address.toLowerCase()] = {
          tokens: [
            token01Infos[reserve.pool_address].token0?.toLowerCase(),
            token01Infos[reserve.pool_address].token1?.toLowerCase(),
          ],
          balances: [reserve.reserve0, reserve.reserve1],
        };

        if (
          token01Infos[reserve.pool_address] &&
          token01Infos[reserve.pool_address].token0 &&
          reserve.reserve0
        ) {
          const token =
            token01Infos[reserve.pool_address]?.token0?.toLowerCase();
          if (!balances[token]) {
            balances[token] = BigNumber(0);
          }
          balances[token] = BigNumber(balances[token]).plus(
            BigNumber(reserve.reserve0.toString()),
          );
        }
        if (
          token01Infos[reserve.pool_address] &&
          token01Infos[reserve.pool_address].token1 &&
          reserve.reserve1
        ) {
          const token =
            token01Infos[reserve.pool_address]?.token1?.toLowerCase();
          if (!balances[token]) {
            balances[token] = BigNumber(0);
          }
          balances[token] = BigNumber(balances[token]).plus(
            BigNumber(reserve.reserve1.toString()),
          );
        }
      });
    });
  }
  console.timeEnd('Getting PairInfo');
  return { balances, poolBalances };
}

/**
 * Gets pool volumes of Uniswap V2 (or it's clone) using subgraph
 *
 * @param queryApi - The URL of Uniswap V2 (or it's clone) subgraph
 * @param querySize - The size of subgprah query
 * @param pools - The array of pools to query
 * @param priorBlockNumber - The block number
 * @param volumeNames - The volume names in subgraph
 * @returns The object containing pool addresses and their volumes
 *
 */
async function getPoolVolumes(
  queryApi: string,
  querySize: number,
  pools: string[],
  priorBlockNumber: number,
  volumeNames: {
    volumeToken0: string;
    volumeToken1: string;
    volumeUsd: string;
  },
): Promise<{
  [key: string]: {
    volumes: string[];
    volumeUsd: string;
  };
}> {
  const volumeNameToken0 = volumeNames?.volumeToken0 || 'volumeToken0';
  const volumeNameToken1 = volumeNames?.volumeToken1 || 'volumeToken1';
  const volumeNameVolumeUsd = volumeNames?.volumeUsd || 'volumeUSD';

  const POOL_VOLUMES_QUERY = (block = null) => gql`
    query getPoolVolumes($pairs: [ID!]) {
      pairs(
        where: { id_in: $pairs },
        ${block ? `block: {number: ${block}},` : ''}
        first: ${querySize}
      ) {
        id
        token0 {
          decimals
        }
        token1 {
          decimals
        }
        ${volumeNameToken0}
        ${volumeNameToken1}
        ${volumeNameVolumeUsd}
      }
    }
  `;

  const poolVolumes = {};

  for (let i = 0; i < pools?.length || 0; i += querySize) {
    try {
      const pairData = await request(queryApi, POOL_VOLUMES_QUERY(), {
        pairs: pools.slice(i, i + querySize),
      }).then((res) => res.pairs);
      const pairData24hAgo = await request(
        queryApi,
        POOL_VOLUMES_QUERY(priorBlockNumber),
        {
          pairs: pools.slice(i, i + querySize),
        },
      ).then((res) => res.pairs);

      pairData.forEach((pair) => {
        poolVolumes[pair.id] = {
          volumes: [
            BigNumber(pair[volumeNameToken0]),
            BigNumber(pair[volumeNameToken1]),
          ],
          volumeUsd: BigNumber(pair[volumeNameVolumeUsd]),
        };
      });
      pairData24hAgo.forEach((pair) => {
        poolVolumes[pair.id] = {
          volumes: [
            poolVolumes[pair.id].volumes[0]
              .minus(pair[volumeNameToken0])
              .times(10 ** (pair.token0.decimals || 0)),
            poolVolumes[pair.id].volumes[1]
              .minus(pair[volumeNameToken1])
              .times(10 ** (pair.token1.decimals || 0)),
          ],
          volumeUsd: poolVolumes[pair.id].volumeUsd.minus(
            pair[volumeNameVolumeUsd],
          ),
        };
      });
    } catch {}
  }
  log.info({
    message: `uni poolVolumes ${poolVolumes}`,
    endpoint: 'getPoolVolumes',
  });
  return poolVolumes;
}

/**
 * Gets token volumes of Uniswap V2 (or it's clone) using subgraph
 *
 * @param queryApi - The URL of Uniswap V2 (or it's clone) subgraph
 * @param querySize - The size of subgprah query
 * @param tokens - The array of tokens to query
 * @param priorBlockNumber - The block number
 * @param volumeNames - The volume names in subgraph
 * @returns The object containing pool addresses and their volumes
 *
 */
async function getTokenVolumes(
  queryApi: string,
  querySize: number,
  tokens: string[],
  priorBlockNumber,
  volumeNames: {
    volume: string;
    volumeUsd: string;
  },
): Promise<{
  [key: string]: {
    volume: string;
    volumeUsd: string;
  };
}> {
  const volumeNameVolume = volumeNames?.volume || 'volume';
  const volumeNameVolumeUsd = volumeNames?.volumeUsd || 'volumeUSD';

  const TOKEN_VOLUMES_QUERY = (block = null) => gql`
    query getTokenVolumes($tokens: [ID!]) {
      tokens(
        where: { id_in: $tokens },
        ${block ? `block: {number: ${block}},` : ''}
        first: ${querySize}
      ) {
        id
        decimals
        ${volumeNameVolume}
        ${volumeNameVolumeUsd}
      }
    }
  `;

  const tokenVolumes = {};

  for (let i = 0; i < tokens?.length || 0; i += querySize) {
    try {
      const tokenData = await request(queryApi, TOKEN_VOLUMES_QUERY(), {
        tokens: tokens.slice(i, i + querySize),
      }).then((res) => res.tokens);
      const tokenData24hAgo = await request(
        queryApi,
        TOKEN_VOLUMES_QUERY(priorBlockNumber),
        {
          tokens: tokens.slice(i, i + querySize),
        },
      ).then((res) => res.tokens);

      tokenData.forEach((token) => {
        tokenVolumes[token.id] = {
          volume: BigNumber(token[volumeNameVolume]),
          volumeUsd: BigNumber(token[volumeNameVolumeUsd]),
        };
      });
      tokenData24hAgo.forEach((token) => {
        tokenVolumes[token.id] = {
          volume: tokenVolumes[token.id].volume
            .minus(token[volumeNameVolume])
            .times(10 ** (token.decimals || 0)),
          volumeUsd: tokenVolumes[token.id].volumeUsd.minus(
            token[volumeNameVolumeUsd],
          ),
        };
      });
    } catch {}
  }

  return tokenVolumes;
}

export default {
  getTvl,
  getPoolVolumes,
  getTokenVolumes,
};
