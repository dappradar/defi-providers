import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';
import BigNumber from 'bignumber.js';

const POOLS_URI = 'https://megaton.fi/api/lp/infoList';
const TON_ADDRESS = 'ton';
const MEGA_VAULT_ADDRESS = 'EQD9Z7L2oLpWvW-NZFB9njBGg2JqIE2rpJ_Fcocg9IEQ-EGF';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  let balances = {};
  const pools = (await axios.get(POOLS_URI)).data[0];

  pools.forEach((pool) => {
    balances[pool.token0 ?? TON_ADDRESS] = BigNumber(
      balances[pool.token0 ?? TON_ADDRESS] || 0,
    ).plus(pool.amount0);
    balances[pool.token1 ?? TON_ADDRESS] = BigNumber(
      balances[pool.token1 ?? TON_ADDRESS] || 0,
    ).plus(pool.amount1);
  });

  const vaultBalances = await web3.eth.getAccountBalances(MEGA_VAULT_ADDRESS);
  balances = formatter.sum([balances, vaultBalances]);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
