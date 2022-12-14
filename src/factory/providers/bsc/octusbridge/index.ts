import calculate from './calculate';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 15222375) {
    return {};
  }

  return calculate.tvl(block, chain, provider, web3);
}

export { tvl };
