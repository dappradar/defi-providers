import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';

const V3_START_BLOCK = 253170358;
const V3_FACTORY_ADDRESS = '0x0558921f7C0f32274BB957D5e8BF873CE1c0c671';

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
