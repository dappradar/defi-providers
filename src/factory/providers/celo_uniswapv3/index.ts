/*==================================================
  Modules
  ==================================================*/

import util from '../../sdk/util';
import uniswapV3 from '../../sdk/helpers/uniswapV3';

/*==================================================
  Settings
  ==================================================*/

const START_BLOCK = 13916355;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo';

/*==================================================
  TVL
  ==================================================*/

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
  util.convertBalancesToFixed(balances);

  return { balances };
}

/*==================================================
  Exports
  ==================================================*/

export { tvl };
