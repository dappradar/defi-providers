import basicUtil from '../../../../util/basicUtil';
import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import PANCAKE_FACTORY_ABI from './abis/factoryabi.json';
import PANCAKE_ABI from './abis/abi.json';
import BULK_RESERVES_ABI from './abis/bulk_reserves.json';
import {
  BULK_RESERVES_ADDRESSES,
  BULK_RESERVES_DEPOLYED,
} from '../../../../constants/contracts.json';
import mostUsedTokens from './mostUsedTokens.json';
import { log } from '../../../../util/logger/logger';

const WBNB_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
const PANCAKE_FACTORY = '0xBCfCcbde45cE874adCB698cC183deBcF17952812';
const BULK_RESERVES_ADDRESS = BULK_RESERVES_ADDRESSES.bsc;

async function getPairReserve(address, block, web3) {
  try {
    const contract = new web3.eth.Contract(PANCAKE_ABI, address);
    const reserves = await contract.methods.getReserves().call(null, block);
    return {
      pool_address: address,
      reserve0: reserves._reserve0.toString(),
      reserve1: reserves._reserve1.toString(),
    };
  } catch {}
  return {};
}

async function getPairReservesPerEach(pInfos, block, web3) {
  const pInfosLength = pInfos.length;
  let reserves_result = [];
  for (let start = 0; start < pInfosLength; start += 10) {
    const end = Math.min(pInfosLength, start + 10);
    const results = await Promise.all(
      pInfos.slice(start, end).map((pool) => getPairReserve(pool, block, web3)),
    );
    reserves_result = reserves_result.concat(results);
  }
  return reserves_result;
}

async function getPoolsReserves(contract, pInfos, block, web3) {
  let poolReserves = [];
  try {
    if (block < BULK_RESERVES_DEPOLYED.bsc) {
      poolReserves = await getPairReservesPerEach(pInfos, block, web3);
    } else {
      try {
        poolReserves = await contract.methods
          .getReservesBulk(pInfos)
          .call(null, block);
        poolReserves.forEach((reserve, index) => {
          poolReserves[index].reserve0 = reserve.reserve0;
          poolReserves[index].reserve1 = reserve.reserve1;
        });
      } catch {
        poolReserves = await getPairReservesPerEach(pInfos, block, web3);
      }
    }

    return poolReserves;
  } catch {}
  return poolReserves;
}

async function getBalances(block, date, chain, provider, web3) {
  if (block < 600615) {
    return {};
  }

  console.log('V1 Calculation Started');
  const balances = {};

  let _pairs = [];
  try {
    _pairs = basicUtil.readDataFromFile(
      'cache/pancakeswappairs.json',
      chain,
      provider,
    );
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getBalances of bsc/pancakeswap`,
      endpoint: 'getBalances',
    });
  }

  const contract = new web3.eth.Contract(PANCAKE_FACTORY_ABI, PANCAKE_FACTORY);
  const bulk_reserves_contract = new web3.eth.Contract(
    BULK_RESERVES_ABI,
    BULK_RESERVES_ADDRESS,
  );

  let len = 0;
  try {
    len = await contract.methods.allPairsLength().call(null, block);
    len = Number(len);
  } catch (e) {
    return;
  }

  console.log(`V1 Pair counts: ${len}`);

  const token01Infos = {};
  const results = await fetch(
    'https://bsc-token-price-api.dappradar.com/pancakeswap_v1/getSimplePairs',
  ).then((res) => res.json());
  const poolInfos = results.map((result) => result.pair);

  results.forEach((result) => {
    token01Infos[result.pair] = {
      token0: mostUsedTokens[result.base] || result.base,
      token1: mostUsedTokens[result.quote] || result.quote,
    };
  });

  if (_pairs.length < poolInfos.length) {
    basicUtil.writeDataToFile(
      poolInfos,
      'cache/pancakeswappairs.json',
      chain,
      provider,
    );
  }

  const filteredResults = await fetch(
    'https://bsc-token-price-api.dappradar.com/pancakeswap_v1/getSimplePairs',
  ).then((res) => res.json());
  const filteredPoolInfos = filteredResults.map((result) => result.pair);

  console.time('V1 Getting PairInfo');

  const poolInfoLength = filteredPoolInfos.length;
  const currentDate = new Date().toISOString().slice(0, 10);
  const bigStep = date === currentDate ? 5000 : 2000;
  const smallStep = date === currentDate ? 250 : 100;
  for (let first = 0; first < poolInfoLength; first += bigStep) {
    const last = Math.min(poolInfoLength, first + bigStep);
    const getMultiPoolsReserves = [];
    console.log(`V1 Getting PairInfo from ${first} to ${last}`);
    for (let start = first; start < last; start += smallStep) {
      const end = Math.min(last, start + smallStep);
      getMultiPoolsReserves.push(
        getPoolsReserves(
          bulk_reserves_contract,
          filteredPoolInfos.slice(start, end),
          block,
          web3,
        ),
      );
    }

    const poolReserves = await Promise.all(getMultiPoolsReserves);

    poolReserves.forEach((reserves) => {
      reserves.forEach((reserve) => {
        const poolAddress = reserve.pool_address.toLowerCase();
        if (token01Infos[poolAddress] && reserve.reserve0 && reserve.reserve1) {
          const token0 = token01Infos[poolAddress].token0;
          const token1 = token01Infos[poolAddress].token1;
          if (
            (token0 !== WBNB_ADDRESS || reserve.reserve0.length > 18) &&
            (token1 !== WBNB_ADDRESS || reserve.reserve1.length > 18)
          ) {
            if (!balances[token0]) {
              balances[token0] = BigNumber(0);
            }
            balances[token0] = balances[token0].plus(
              BigNumber(reserve.reserve0),
            );
            if (!balances[token1]) {
              balances[token1] = BigNumber(0);
            }
            balances[token1] = balances[token1].plus(
              BigNumber(reserve.reserve1),
            );
          }
        }
      });
    });
  }

  console.timeEnd('V1 Getting PairInfo');

  return balances;
}

export { getBalances };
