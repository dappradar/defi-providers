import fetch from 'node-fetch';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_API = 'https://api.tangent.bar/api/v1/pools?start=0&limit=5000';

async function getPoolBalance(pool, info, block, web3) {
  const balances = [];
  try {
    const balance0 = await web3.eth.getTokenBalance(pool, info.token0, block);
    const balance1 = await web3.eth.getTokenBalance(pool, info.token1, block);

    if (info.token0 == 'HBAR') {
      balances.push({
        token: 'hbar',
        balance: balance0.times(2),
      });
    } else if (info.token1 == 'HBAR') {
      balances.push({
        token: 'hbar',
        balance: balance1.times(2),
      });
    } else {
      balances.push({
        token: info.token0,
        balance: balance1,
      });
      balances.push({
        token: info.token0,
        balance: balance1,
      });
    }
  } catch {}
  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 1657799935) {
    return {};
  }

  let pools = {};
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  try {
    const tangentPools = await fetch(POOL_API)
      .then((res) => res.json())
      .then((res) => res.pools);

    tangentPools.forEach((pool) => {
      pools[pool.address] = {
        token0: pool.firstAsset.assetId,
        token1: pool.secondAsset.assetId,
      };
    });

    basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);
  } catch {}

  const poolBalances = await Promise.all(
    Object.keys(pools).map((address) =>
      getPoolBalance(address, pools[address], block, web3),
    ),
  );

  const balances = {};

  poolBalances.forEach((poolBalance) => {
    formatter.sumMultiBalanceOf(balances, poolBalance);
  });

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
