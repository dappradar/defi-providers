import util from '../../../../util/blockchainUtil';
import uniswapV3 from '../../../../util/uniswapV3';
import formatter from '../../../../util/formatter';

const START_BLOCK = 13916355;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo';

async function tvl(params) {
  const { block, chain } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await uniswapV3.getTvlFromSubgraph(
    THEGRAPTH_ENDPOINT,
    block,
    chain,
  );
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
