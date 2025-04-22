import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 5345079;
const V3_START_BLOCK = 5644236;
const V2_FACTORY_ADDRESS = '0x4B599f3425D54AfBf94bFD41EA9931fF92AD6551';
const V3_FACTORY_ADDRESS = '0x6Ea64BDCa26F69fdeF36C1137A0eAe5Bf434e8fd';

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
