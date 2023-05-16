import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import dodo from '../../../../util/calculators/dodo';

const START_BLOCK = 1835596;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/dodoex/dodoex-v2-moonriver';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const { balances, poolBalances } = await dodo.getTvlFromSubgraph(
    THEGRAPTH_ENDPOINT,
    block,
    chain,
  );

  return { balances, poolBalances };
}
export { tvl };
