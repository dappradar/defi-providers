import uniswapV3 from '../../../../util/calculators/uniswapV3';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 13916355;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo';

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
