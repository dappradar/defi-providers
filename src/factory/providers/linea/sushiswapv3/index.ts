import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';

const V3_START_BLOCK = 53256;
const V3_FACTORY_ADDRESS = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V3_START_BLOCK) {
    return { balances: {} };
  }

  const balances = await uniswapV3.getTvl(
    V3_FACTORY_ADDRESS,
    V3_START_BLOCK,
    block,
    chain,
    provider,
    web3,
  );

  return { balances, poolBalances: {} };
}

export { tvl };
