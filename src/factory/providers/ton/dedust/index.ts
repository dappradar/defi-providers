import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';
import BigNumber from 'bignumber.js';

const POOLS_URI = 'https://api.dedust.io/v1/pools';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  const pools = (await axios.get(POOLS_URI)).data;

  pools.forEach((pool) => {
    balances[pool.left_token_root] = BigNumber(
      balances[pool.left_token_root] || 0,
    ).plus(pool.left_token_reserve);
    balances[pool.right_token_root] = BigNumber(
      balances[pool.right_token_root] || 0,
    ).plus(pool.right_token_reserve);
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
