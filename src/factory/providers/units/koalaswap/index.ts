import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';

const START_BLOCK = 2291892;
const FACTORY_ADDRESS = '0xcF3Ee60d29531B668Ae89FD3577E210082Da220b';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = await uniswapV3.getTvl(
    FACTORY_ADDRESS,
    START_BLOCK,
    block,
    chain,
    provider,
    web3,
  );

  return { balances, poolBalances: {} };
}

export { tvl };
