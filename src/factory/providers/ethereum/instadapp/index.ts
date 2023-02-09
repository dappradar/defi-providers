import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import fetch from 'node-fetch';

const API =
  'https://api.internal.instadapp.io/defi/api/stats/instadapp/overall';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11161291) {
    return {};
  }

  const balances = {};

  balances['0xdac17f958d2ee523a2206206994597c13d831ec7'] = await fetch(API)
    .then((res) => res.json())
    .then((res) => BigNumber(res.stats[0].totalSupplied).shiftedBy(6));

  return { balances };
}

export { tvl };
