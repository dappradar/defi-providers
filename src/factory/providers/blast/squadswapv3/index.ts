import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';

const V3_START_BLOCK = 5644236;
const V3_FACTORY_ADDRESS = '0x6Ea64BDCa26F69fdeF36C1137A0eAe5Bf434e8fd';

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
