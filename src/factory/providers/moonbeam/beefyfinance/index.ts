import beefyfinance from '../../../../util/calculators/beefyfinance';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 380863;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await beefyfinance.getTvl(block, chain, provider, web3);

  return { balances };
}

export { tvl };
