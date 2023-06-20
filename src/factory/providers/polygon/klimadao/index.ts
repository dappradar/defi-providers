import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import BULK_RESERVES_ABI from '../../../../constants/abi/bulkReserves.json';
import {
  BULK_RESERVES_ADDRESSES,
  BULK_RESERVES_DEPOLYED,
} from '../../../../constants/contracts.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import PAIR_ABI from '../../../../constants/abi/uni.json';
import { log } from '../../../../util/logger/logger';

const TREASURY = '0x7Dd4f0B986F032A44F913BF92c9e8b7c17D77aD7';
const BCT = '0x2f800db0fdb5223b3c3f354886d907a671414a7f';
const POOLS = [
  '0x1e67124681b402064cd0abe8ed1b5c79d2e02f64',
  '0x9803c7ae526049210a1725f7487af26fe2c24614',
];

async function getReserves(address, block, web3) {
  try {
    const contract = new web3.eth.Contract(PAIR_ABI, address);
    const reserves = await contract.methods.getReserves().call(null, block);
    return {
      pool_address: address,
      reserve0: BigNumber(reserves._reserve0.toString()),
      reserve1: BigNumber(reserves._reserve1.toString()),
    };
  } catch (e) {}
  return {};
}

async function getPoolsReserves(bulk_reserves_contract, pools, block, web3) {
  let poolReserves = [];
  try {
    if (block < BULK_RESERVES_DEPOLYED.polygon) {
      poolReserves = await Promise.all(
        pools.map((pool) => getReserves(pool, block, web3)),
      );
    } else {
      try {
        poolReserves = await bulk_reserves_contract.methods
          .getReservesBulk(pools)
          .call(null, block);
      } catch (e) {
        log.error({
          message: e?.message || '',
          stack: e?.stack || '',
          detail: `Error: getPoolsReserves of polygon/klimadao`,
          endpoint: 'getPoolsReserves',
        });
        poolReserves = await Promise.all(
          pools.map((pool) => getReserves(pool, block, web3)),
        );
      }
    }
    return poolReserves;
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getPoolsReserves of polygon/klimadao`,
      endpoint: 'getPoolsReserves',
    });
  }
  return poolReserves;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 20078351) {
    return {};
  }

  let pools = {};

  try {
    pools = await basicUtil.readFromCache('pools.json', chain, provider);
  } catch {}

  const tokenBalances = await util.getTokenBalances(
    TREASURY,
    [BCT],
    block,
    chain,
    web3,
  );

  const bulk_reserves_contract = new web3.eth.Contract(
    BULK_RESERVES_ABI,
    BULK_RESERVES_ADDRESSES.polygon,
  );

  const newPools = POOLS.filter((pool) => !pools[pool]);

  if (newPools.length > 0) {
    const tokens01 = await bulk_reserves_contract.methods
      .getToken01Bulk(newPools)
      .call();

    tokens01.forEach((token01, index) => {
      if (token01) {
        pools[newPools[index]] = {
          token0: token01.token0.toLowerCase(),
          token1: token01.token1.toLowerCase(),
        };
      }
    });
    await basicUtil.savedIntoCache(pools, 'pools.json', chain, provider);
  }

  const reserves = await getPoolsReserves(
    bulk_reserves_contract,
    POOLS,
    block,
    web3,
  );

  reserves.forEach((reserve, index) => {
    if (reserve) {
      tokenBalances.push({
        token: pools[POOLS[index]].token0,
        balance: BigNumber(reserve.reserve0),
      });
      tokenBalances.push({
        token: pools[POOLS[index]].token1,
        balance: BigNumber(reserve.reserve1),
      });
    }
  });

  const balances = {};

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
