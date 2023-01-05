import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import * as v3TVL from './v3';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const v3 = await v3TVL.tvl(block, chain, provider, web3);

  const balances = {};

  for (const token in v3) {
    const address = token.toLowerCase();
    if (!balances[address]) {
      balances[address] = BigNumber(0);
    }
    balances[address] = balances[address].plus(v3[token]);
  }

  for (const token in balances) {
    if (balances[token].isLessThan(10_000_000_000)) {
      delete balances[token];
    } else {
      balances[token] = balances[token].toFixed();
    }
  }

  return { balances };
}

export { tvl };
