import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';
import BigNumber from 'bignumber.js';

const POOLS_URI = 'https://api.ston.fi/v1/pools?dex_v2=true';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  const result = await axios.get(POOLS_URI);
  const pools = result.data.pool_list;

  pools.forEach((pool) => {
    balances[pool.token0_address] = BigNumber(
      balances[pool.token0_address] || 0,
    ).plus(pool.reserve0);
    balances[pool.token1_address] = BigNumber(
      balances[pool.token1_address] || 0,
    ).plus(pool.reserve1);
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
