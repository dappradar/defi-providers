import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import * as v3TVL from './v3';

const START_BLOCK = 10000835;
const V2_FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const [v2, v3] = await Promise.all([
    uniswapV2.getTvl(V2_FACTORY_ADDRESS, block, chain, provider, web3),
    v3TVL.tvl(block, chain, provider, web3),
  ]);

  const balances = {};

  for (const token in v2.balances) {
    const address = token.toLowerCase();
    if (!balances[address]) {
      balances[address] = BigNumber(0);
    }
    balances[address] = balances[address].plus(v2.balances[token]);
  }
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
