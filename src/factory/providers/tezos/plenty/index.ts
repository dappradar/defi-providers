import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';
import PAIR_ABI from '../../../../constants/abi/uni.json';
import BULK_RESERVES_ABI from '../../../../constants/abi/bulkReserves.json';
import { log } from '../../../../util/logger/logger';

const BULK_RESERVES_ADDRESS = '0x92E144b73abb3b1aA4BEA18d4dbc142F95a3E56a';
let token01Infos;

async function getReserves(address, block, web3) {
  try {
    const contract = new web3.eth.Contract(PAIR_ABI, address);
    await contract.init();
    if (!token01Infos[address]) {
      const token1Check = await contract.methods.token1Check().call();
      const token2Check = await contract.methods.token2Check().call();
      const token1Id = await contract.methods.token1Id().call();
      const token2Id = await contract.methods.token2Id().call();
      const token1Address = await contract.methods.token1Address().call();
      const token2Address = await contract.methods.token2Address().call();
      token01Infos[address] = {};
      token01Infos[address].token0 = token1Check
        ? `${token1Address}_${token1Id}`
        : token1Address;
      token01Infos[address].token1 = token2Check
        ? `${token2Address}_${token2Id}`
        : token2Address;
    }
    return {
      pool_address: address,
      reserve0: await contract.methods.token1_pool().call(null, block),
      reserve1: await contract.methods.token2_pool().call(null, block),
    };
  } catch (e) {}
  return {};
}

async function getPoolsReserves(bulk_reserves_contract, pInfos, block, web3) {
  let poolReserves = [];
  try {
    poolReserves = await Promise.all(
      pInfos.map((pool) => getReserves(pool, block, web3)),
    );
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getPoolsReserves of tezos/plenty`,
      endpoint: 'getPoolsReserves',
    });
  }
  return poolReserves;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 0) {
    return {};
  }
  console.log('Calculation Started');
  const balances = {};
  const poolBalances = {};
  const _pairs = basicUtil.readDataFromFile('./pools.json', chain, provider);
  let _token01 = {};
  try {
    _token01 = basicUtil.readDataFromFile(
      './cache/token01.json',
      chain,
      provider,
    );
  } catch {}

  const bulk_reserves_contract = new web3.eth.Contract(
    BULK_RESERVES_ABI,
    BULK_RESERVES_ADDRESS,
  );

  const len = _pairs.length;

  console.log(`Pair counts: ${len}`);

  let poolInfos = _pairs;

  poolInfos = poolInfos.slice(0, len);

  token01Infos = _token01;

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

  await basicUtil.writeDataToFile(
    token01Infos,
    'token01.json',
    chain,
    provider,
  );

  console.timeEnd('Getting PairInfo');

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
