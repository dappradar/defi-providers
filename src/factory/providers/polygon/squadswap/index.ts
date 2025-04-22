import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 61787381;
const V3_START_BLOCK = 61864971;
const V2_FACTORY_ADDRESS = '0xEE8F37D490CB7Ea1dae7d080c5738894731299f0';
const V3_FACTORY_ADDRESS = '0x633Faf3DAc3677b51ea7A53a81b79AEe944714dc';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  let balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const v2 = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  if (block >= V3_START_BLOCK) {
    balances = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
      'algebra',
    );
  }

  balances = formatter.sum([v2.balances, balances]);

  return { balances };
}

export { tvl };
