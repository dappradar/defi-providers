import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';
import BigNumber from 'bignumber.js';

const START_BLOCK = 8776234;

const MARKETS = ['0xB73550bC1393207960A385fC8b34790e5133175E'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  for (const market of MARKETS) {
    const marketBalances = await aaveV3.getTvl(market, block, chain, web3);

    for (const [key, value] of Object.entries(marketBalances)) {
      balances[key] = new BigNumber(balances[key] || 0).plus(value).toFixed();
    }
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
