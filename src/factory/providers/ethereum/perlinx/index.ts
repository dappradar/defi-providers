import BigNumber from 'bignumber.js';
import FACTORY_ABI from './abi.json';
import PAIR_ABI from '../../../../constants/abi/uni.json';
import BULK_RESERVES_ABI from '../../../../constants/abi/bulkReserves.json';
import {
  BULK_RESERVES_ADDRESSES,
  BULK_RESERVES_DEPOLYED,
} from '../../../../constants/contracts.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const FACTORY_ADDRESS = '0x5Fa19F612dfd39e6754Bb2E8300E681d1C589Dd4';
const PERL_ADDRESS = '0xeca82185adCE47f39c684352B0439f030f860318';
const BULK_RESERVES_ADDRESS = BULK_RESERVES_ADDRESSES.ethereum;
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

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

async function getPoolsReserves(bulk_reserves_contract, pInfos, block, web3) {
  let poolReserves = [];
  try {
    if (block < BULK_RESERVES_DEPOLYED.ethereum) {
      poolReserves = await Promise.all(
        pInfos.map((pool) => getReserves(pool, block, web3)),
      );
    } else {
      try {
        poolReserves = await bulk_reserves_contract.methods
          .getReservesBulk(pInfos)
          .call(null, block);
      } catch (e) {
        poolReserves = await Promise.all(
          pInfos.map((pool) => getReserves(pool, block, web3)),
        );
      }
    }
    return poolReserves;
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getPoolsReserves of ethereum/perlinx`,
      endpoint: 'getPoolsReserves',
    });
  }
  return poolReserves;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 10695643) {
    return {};
  }

  console.log('Calculation Started');

  const balances = {};
  const poolBalances = {};

  let _pairs = [];
  let _token01 = {};
  try {
    _pairs = await basicUtil.readFromCache('pairs.json', chain, provider);
  } catch {}
  try {
    _token01 = await basicUtil.readFromCache('token01.json', chain, provider);
  } catch {}

  const contract = new web3.eth.Contract(FACTORY_ABI, FACTORY_ADDRESS);
  const bulk_reserves_contract = new web3.eth.Contract(
    BULK_RESERVES_ABI,
    BULK_RESERVES_ADDRESS,
  );

  let len = 0;
  try {
    len = await contract.methods.poolCount().call(null, block);
    len = Number(len);
  } catch (e) {
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
      pInfos.push(contract.methods.arrayPerlinPools(i).call());
    }
    try {
      pInfos = await Promise.all(pInfos);
      pInfos.forEach((info) => poolInfos.push(info));
    } catch (e) {
      break;
    }
  }

  if (pairLength < len) {
    await basicUtil.savedIntoCache(poolInfos, 'pairs.json', chain, provider);
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
  await basicUtil.savedIntoCache(token01Infos, 'token01.json', chain, provider);

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
          web3,
        ),
      );
    }

    const poolReserves = await Promise.all(getMultiPoolsReserves);

    poolReserves.forEach((reserves) => {
      reserves.forEach((reserve) => {
        poolBalances[reserve.pool_address] = {
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

  try {
    const synthCount = await util.executeCall(
      FACTORY_ADDRESS,
      FACTORY_ABI,
      'synthCount',
      [],
      block,
      chain,
      web3,
    );
    if (Number(synthCount) > 0) {
      const synths = await util.executeMultiCallsOfTarget(
        FACTORY_ADDRESS,
        FACTORY_ABI,
        'arraySynths',
        Array.from(Array(synthCount).keys()),
        block,
        chain,
        web3,
      );

      const emps = await util.executeMultiCallsOfTarget(
        FACTORY_ADDRESS,
        FACTORY_ABI,
        'mapSynth_EMP',
        synths,
        block,
        chain,
        web3,
      );

      const balanceResults = await util.getTokenBalancesOfHolders(
        emps,
        emps.map((_) => PERL_ADDRESS),
        block,
        chain,
        web3,
      );

      formatter.sumMultiBalanceOf(balances, balanceResults);
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of ethereum/perlinx`,
      endpoint: 'tvl',
    });
  }

  for (const token in balances) {
    if (balances[token].isLessThan(100000)) {
      delete balances[token];
    } else {
      balances[token] = balances[token].toFixed();
    }
  }

  return { balances, poolBalances };
}

export { tvl };
