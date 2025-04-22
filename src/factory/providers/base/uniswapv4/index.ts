import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV4 from '../../../../util/calculators/uniswapV4';

const V4_START_BLOCK = 25350988;
const V4_POOL_MANAGER_ADDRESS = '0x498581fF718922c3f8e6A244956aF099B2652b2b';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V4_START_BLOCK) {
    return { balances: {} };
  }

  const balances = await uniswapV4.getTvl(
    V4_POOL_MANAGER_ADDRESS,
    V4_START_BLOCK,
    block,
    chain,
    provider,
    web3,
  );

  return { balances, poolBalances: {} };
}

export { tvl };
