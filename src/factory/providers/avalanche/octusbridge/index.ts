import BigNumber from 'bignumber.js';
import * as calculate from '../../ethereum/octusbridge/calculate';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CONVERT = {
  '0x1ffefd8036409cb6d652bd610de465933b226917': {
    coingecko: 'coingecko_everscale',
    decimals: 9,
  },
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block } = params;
  let balances = {};

  if (block < 13851414) {
    return {};
  }
  balances = await calculate.tvl(params);

  for (const token in balances) {
    if (CONVERT[token]) {
      balances[CONVERT[token].coingecko] = BigNumber(balances[token])
        .div(10 ** CONVERT[token].decimals)
        .toFixed();
      delete balances[token];
    }
  }

  return { balances };
}

export { tvl };
