import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 11700000;
const V3_START_BLOCK = 73691955;
const V2_FACTORY_ADDRESS = '0x6EcCab422D763aC031210895C81787E87B43A652';
const V3_THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/camelotlabs/camelot-amm-v3';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const v2 = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  let v3 = { balances: {}, poolBalances: {} };
  if (block > V3_START_BLOCK) {
    v3 = await uniswapV3.getTvlFromSubgraph(
      V3_THEGRAPTH_ENDPOINT,
      block,
      chain,
      provider,
    );
  }

  const balances = formatter.sum([v2.balances, v3.balances]);
  const poolBalances = { ...v2.poolBalances, ...v3.poolBalances };

  return { balances, poolBalances };
}

export { tvl };
