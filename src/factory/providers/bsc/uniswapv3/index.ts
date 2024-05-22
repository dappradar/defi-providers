import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import uniswapV3 from '../../../../util/calculators/uniswapV3';

const START_BLOCK = 0;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/revert-finance/uniswap-v3-bnb';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const { balances, poolBalances } = await uniswapV3.getTvlFromSubgraph(
    THEGRAPTH_ENDPOINT,
    block,
    chain,
    provider,
    100,
  );
  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}
export { tvl };
