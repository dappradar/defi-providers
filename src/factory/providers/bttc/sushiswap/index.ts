import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';
import { PromisePool } from '@supercharge/promise-pool';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import FACTORY_ABI from '../../../../constants/abi/factory.json';
import PAIR_ABI from '../../../../constants/abi/uni.json';
import RESERVES_ABI from '../../../../constants/abi/uniReserves.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 28215551;
const FACTORY_ADDRESS = '0xB45e53277a7e0F1D35f2a77160e91e25507f1763';
const BTT_ADDRESS = '0x0000000000000000000000000000000000001010';
const WBTT_ADDRESS = '0x23181f21dea5936e24163ffaba4ea3b316b57f3c';

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

  let len = 0;

  try {
    if (!usePoolMethods) {
      len = await contract.methods.allPairsLength().call(null, block);
    } else {
      len = await contract.methods.allPoolsLength().call(null, block);
    }
    len = Number(len);
  } catch (e) {
    console.log(e);
    return;
  }

  log.info({
    message: `Pair counts: ${len}`,
    endpoint: 'getTvl',
  });

  let poolInfos = _pairs;
  const pairLength = _pairs.length;

  for (let start = pairLength; start < len; start += 1) {
    let pInfos = [];
    const end = Math.min(start + 1, len);
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
      pInfos = await Promise.all(pInfos);
      pInfos.forEach((info) => poolInfos.push(info));
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: getTvl of ${chain}/${provider}`,
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
  for (let start = 0; start < newPoolLength; start += 1) {
    const end = Math.min(newPoolLength, start + 1);
    log.info({
      message: `Getting Token01 from ${start} to ${end}`,
      endpoint: 'getTvl',
    });
    const subPools = newPools.slice(start, end);
    try {
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
  for (let first = 0; first < poolInfos.length; first += 1) {
    const last = Math.min(poolInfos.length, first + 1);
    log.info({
      message: `Getting PairInfo from ${first} to ${last}`,
      endpoint: 'getTvl',
    });
    const getMultiPoolsReserves = [];
    for (let start = first; start < last; start += 50) {
      const end = Math.min(last, start + 50);
      getMultiPoolsReserves.push(
        getPoolsReserves(
          poolInfos.slice(start, end),
          block,
          chain,
          web3,
          provider,
        ),
      );
    }

    const { results: poolReserves } = await PromisePool.withConcurrency(1)
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

async function getPoolsReserves(pInfos, block, chain, web3, provider) {
  let poolReserves = [];
  try {
    poolReserves = await Promise.all(
      pInfos.map((pool) => getReserves(pool, block, web3, chain, provider)),
    );

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

async function getReserves(address, block, web3, chain, provider) {
  try {
    const contract = new web3.eth.Contract(PAIR_ABI, address);
    const reserves = await contract.methods.getReserves().call(null, block);
    return {
      pool_address: address,
      reserve0: BigNumber(reserves._reserve0.toString()),
      reserve1: BigNumber(reserves._reserve1.toString()),
    };
  } catch (e) {
    try {
      const contract = new web3.eth.Contract(RESERVES_ABI, address);
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
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  formatter.convertBalancesToFixed(balances);

  if (balances[WBTT_ADDRESS]) {
    balances[BTT_ADDRESS] = balances[WBTT_ADDRESS];
    delete balances[WBTT_ADDRESS];
  }

  return { balances, poolBalances };
}

export { tvl };
