import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 253139604;
const V3_START_BLOCK = 253170358;
const V2_FACTORY_ADDRESS = '0xba34aA640b8Be02A439221BCbea1f48c1035EEF9';
const V3_FACTORY_ADDRESS = '0x0558921f7C0f32274BB957D5e8BF873CE1c0c671';

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
