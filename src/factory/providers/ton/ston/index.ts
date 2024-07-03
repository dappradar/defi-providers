import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';
import BigNumber from 'bignumber.js';

const POOLS_URI = 'https://app.ston.fi/rpc';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  const pools = (
    await axios.post(POOLS_URI, {
      jsonrpc: '2.0',
      id: 2,
      method: 'pool.list',
      params: {},
    })
  ).data.result.pools;

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
