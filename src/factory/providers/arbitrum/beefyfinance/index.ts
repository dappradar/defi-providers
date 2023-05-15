import BigNumber from 'bignumber.js';
import beefyfinance from '../../../../util/calculators/beefyfinance';
import util from '../../../../util/blockchainUtil';
import * as gmx from '../gmx/index';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const E_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const GMX_WANT = '0x5402b5f40310bded796c7d0f3ff6683f5c0cffdf';

const START_BLOCK = 11700000;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = await beefyfinance.getTvl(block, chain, provider, web3);

  if (balances[E_ADDRESS]) {
    balances['eth'] = balances[E_ADDRESS];
    delete balances[E_ADDRESS];
  }

  if (balances[GMX_WANT]) {
    const glpTotalSupply = await util
      .getTotalSupply(GMX_WANT, block, web3)
      .then((res) => res.totalSupply);
    const ratio = BigNumber(balances[GMX_WANT]).div(glpTotalSupply);
    const gmxBalances = await gmx.tvl(params);
    for (const [key, value] of Object.entries(gmxBalances.balances)) {
      balances[key] = BigNumber(balances[key] || 0)
        .plus(BigNumber(value).times(ratio))
        .toFixed();
    }
    delete balances[GMX_WANT];
  }

  return { balances };
}

export { tvl };
