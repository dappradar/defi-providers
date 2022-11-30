/*==================================================
  Modules
  ==================================================*/

import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import FACTORY_ABI from './abi/factory.json';
import PAIR_ABI from './abi/uni.json';
import RESERVES_ABI from './abi/uniReserves.json';
import BULK_RESERVES_ABI from './abi/bulkReserves.json';
import {
  BULK_RESERVES_ADDRESSES,
  BULK_RESERVES_DEPOLYED,
} from '../constants/contracts.json';
import web3 from '../web3';
import basicUtil from './basicUtil';

/*==================================================
  Settings
  ==================================================*/

/*==================================================
  Helper Methods
  ==================================================*/

async function getReserves(address, block) {
  try {
    const contract = new web3.eth.Contract(PAIR_ABI, address);
    const reserves = await contract.methods.getReserves().call(null, block);
    return {
      pool_address: address,
      reserve0: BigNumber(reserves._reserve0.toString()),
      reserve1: BigNumber(reserves._reserve1.toString()),
    };
  } catch {
    try {
      const contract = new web3.eth.Contract(RESERVES_ABI, address);
      const reserves = await contract.methods.getReserves().call(null, block);
      return {
        pool_address: address,
        reserve0: BigNumber(reserves._reserve0.toString()),
        reserve1: BigNumber(reserves._reserve1.toString()),
      };
    } catch {}
  }
  return {};
}

async function getPoolsReserves(bulk_reserves_contract, pInfos, block, chain) {
  let poolReserves = [];
  try {
    if (block < BULK_RESERVES_DEPOLYED[chain]) {
      poolReserves = await Promise.all(
        pInfos.map((pool) => getReserves(pool, block)),
      );
    } else {
      try {
        poolReserves = await bulk_reserves_contract.methods
          .getReservesBulk(pInfos)
          .call(null, block);
      } catch (e) {
        console.log(e.message);
        poolReserves = await Promise.all(
          pInfos.map((pool) => getReserves(pool, block)),
        );
      }
    }
    return poolReserves;
  } catch (e) {
    console.log(e.message);
  }
  return poolReserves;
}

async function getTvl(
  factoryAddress,
  block,
  chain,
  provider,
  usePoolMethods = false,
) {
  const balances = {};
  const poolBalances = {};

  let _pairs = [];
  let _token01 = {};
  try {
    _pairs = basicUtil.readDataFromFile('cache/pairs.json', chain, provider);
  } catch {}
  try {
    _token01 = basicUtil.readDataFromFile(
      'cache/token01.json',
      chain,
      provider,
    );
  } catch {}

  const contract = new web3.eth.Contract(FACTORY_ABI, factoryAddress);
  const bulk_reserves_contract = new web3.eth.Contract(
    BULK_RESERVES_ABI,
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
  } catch {
    return;
  }

  console.log(`Pair counts: ${len}`);

  let poolInfos = _pairs;
  const pairLength = _pairs.length;

  for (let start = pairLength; start < len; start += 3000) {
    let pInfos = [];
    const end = Math.min(start + 3000, len);
    console.log(`Getting Pairs from ${start} to ${end}`);
    for (let i = start; i < end; i++) {
      if (!usePoolMethods) {
        pInfos.push(contract.methods.allPairs(i).call());
      } else {
        pInfos.push(contract.methods.allPools(i).call());
      }
    }
    try {
      pInfos = await Promise.all(pInfos);
      pInfos.forEach((info) => poolInfos.push(info));
    } catch (e) {
      break;
    }
  }

  if (pairLength < len) {
    basicUtil.writeDataToFile(poolInfos, 'cache/pairs.json', chain, provider);
  }

  poolInfos = poolInfos.slice(0, len);

  const token01Infos = _token01;
  const newPools = poolInfos.filter((info) => !_token01[info]);
  const newPoolLength = newPools.length;
  for (let start = 0; start < newPoolLength; start += 300) {
    const end = Math.min(newPoolLength, start + 300);
    console.log(`Getting Token01 from ${start} to ${end}`);
    const subPools = newPools.slice(start, end);
    try {
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
    } catch {
      console.log(`Getting Token01 got issue at ${start}`);
    }
  }

  basicUtil.writeDataToFile(
    token01Infos,
    'cache/token01.json',
    chain,
    provider,
  );

  console.time('Getting PairInfo');

  for (let first = 0; first < poolInfos.length; first += 1500) {
    const last = Math.min(poolInfos.length, first + 1500);
    console.log(`Getting PairInfo from ${first} to ${last}`);
    const getMultiPoolsReserves = [];
    for (let start = first; start < last; start += 50) {
      const end = Math.min(last, start + 50);
      getMultiPoolsReserves.push(
        getPoolsReserves(
          bulk_reserves_contract,
          poolInfos.slice(start, end),
          block,
          chain,
        ),
      );
    }

    const poolReserves = await Promise.all(getMultiPoolsReserves);

    poolReserves.forEach((reserves) => {
      reserves.forEach((reserve) => {
        poolBalances[reserve.pool_address.toLowerCase()] = {
          tokens: [
            token01Infos[reserve.pool_address].token0,
            token01Infos[reserve.pool_address].token1,
          ],
          balances: [reserve.reserve0, reserve.reserve1],
        };

        if (
          token01Infos[reserve.pool_address] &&
          token01Infos[reserve.pool_address].token0 &&
          reserve.reserve0
        ) {
          const token = token01Infos[reserve.pool_address].token0;
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
          const token = token01Infos[reserve.pool_address].token1;
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

async function getPoolVolumes(
  queryApi,
  querySize,
  pools,
  priorBlockNumber,
  volumeNames,
) {
  const volumeNameToken0 = volumeNames.volumeToken0 || 'volumeToken0';
  const volumeNameToken1 = volumeNames.volumeToken1 || 'volumeToken1';
  const volumeNameVolumeUsd = volumeNames.volumeUsd || 'volumeUSD';

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

  for (let i = 0; i < pools.length; i += querySize) {
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

  return poolVolumes;
}

async function getTokenVolumes(
  queryApi,
  querySize,
  tokens,
  priorBlockNumber,
  volumeNames,
) {
  const volumeNameVolume = volumeNames.volume || 'volume';
  const volumeNameVolumeUsd = volumeNames.volumeUsd || 'volumeUSD';

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

  for (let i = 0; i < tokens.length; i += querySize) {
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

/*==================================================
  Exports
  ==================================================*/

export default {
  getTvl,
  getPoolVolumes,
  getTokenVolumes,
};
