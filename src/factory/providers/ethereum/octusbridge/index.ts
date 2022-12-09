import * as calculate from './calculate';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block } = params;

  if (block < 14193653) {
    return {};
  }

  return calculate.tvl(params);
}

export { tvl };
