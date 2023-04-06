import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import pancakeswapV3subgraph from '../../../../util/calculators/pancakeswapV3subgraph';

const START_BLOCK = 26956207;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/messari/pancakeswap-v3-bsc';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return { balances: {} };
  }
  const balances = await pancakeswapV3subgraph.getTvlFromSubgraph(
    THEGRAPTH_ENDPOINT,
    block,
  );

  return { balances };
}

export { tvl };
