import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV3 from '../../../../util/calculators/uniswapV3';

const V3_START_BLOCK = 1371680;
const SUBGRAPH_URL =
  'https://gateway.thegraph.com/api/subgraphs/id/HMuAwufqZ1YCRmzL2SfHTVkzZovC9VL2UAKhjvRqKiR1';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V3_START_BLOCK) {
    return { balances: {} };
  }

  const { balances, poolBalances } = await uniswapV3.getTvlFromSubgraph(
    SUBGRAPH_URL,
    block - 1000,
    chain,
    provider,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
