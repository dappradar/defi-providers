import BigNumber from 'bignumber.js';
import PAIR_ABI from '../../../../constants/abi/uni.json';
import BULK_RESERVES_ABI from '../../../../constants/abi/bulkReserves.json';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const BULK_RESERVES_ADDRESS = '0x92E144b73abb3b1aA4BEA18d4dbc142F95a3E56a';

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
    if (block < 78609070) {
      poolReserves = await Promise.all(
        pInfos.map((pool) => getReserves(pool, block, web3)),
      );
    } else {
      try {
        poolReserves = await bulk_reserves_contract.methods
          .getReservesBulk(pInfos)
          .call(null, block);
      } catch (e) {
        console.log(e.message);
        poolReserves = await Promise.all(
          pInfos.map((pool) => getReserves(pool, block, web3)),
        );
      }
    }
    return poolReserves;
  } catch (e) {
    console.log(e.message);
  }
  return poolReserves;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 7860907) {
    return {};
  }

  console.log('Calculation Started');

  const balances = {};
  const poolBalances = {};

  const _pairs = [
    '0xc6344bc1604fcab1a5aad712d766796e2b7a70b9',
    '0x306a28279d04a47468ed83d55088d0dcd1369294',
    '0xa7964991f339668107e2b6a6f6b8e8b74aa9d017',
  ];
  let _token01 = {};
  try {
    _token01 = basicUtil.readDataFromFile(
      'cache/token01.json',
      chain,
      provider,
    );
  } catch {}

  const bulk_reserves_contract = new web3.eth.Contract(
    BULK_RESERVES_ABI,
    BULK_RESERVES_ADDRESS,
  );

  const len = 3;

  console.log(`Pair counts: ${len}`);

  let poolInfos = _pairs;

  poolInfos = poolInfos.slice(0, len);

  const token01Infos = _token01;
  const newPools = poolInfos.filter((info) => !_token01[info]);
  const newPoolLength = newPools.length;
  for (let i = 0; i < newPoolLength; i += 1) {
    console.log(`Getting Token01 of Pair ${i}`);
    const contract = new web3.eth.Contract(PAIR_ABI, newPools[i]);
    token01Infos[newPools[i]] = {};
    token01Infos[newPools[i]].token0 = (
      await contract.methods.token0().call()
    ).toLowerCase();
    token01Infos[newPools[i]].token1 = (
      await contract.methods.token1().call()
    ).toLowerCase();
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

  for (const token in balances) {
    if (balances[token].isLessThan(100000)) {
      delete balances[token];
    } else {
      balances[token] = balances[token].toFixed();
    }
  }

  // console.log(balances);

  return { balances, poolBalances };
}

export { tvl };
