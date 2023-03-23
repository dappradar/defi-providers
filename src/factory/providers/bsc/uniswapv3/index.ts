import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import uniswapV3 from '../../../../util/calculators/uniswapV3';

const START_BLOCK = 0;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/revert-finance/uniswap-v3-bnb';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV3.getTvlFromSubgraph(
    THEGRAPTH_ENDPOINT,
    block,
    chain,
  );
  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}
export { tvl };
