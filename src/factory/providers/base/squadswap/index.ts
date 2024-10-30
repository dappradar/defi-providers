import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import uniswapV2 from '../../../../util/calculators/uniswapV2';

const V2_START_BLOCK = 19727118;
const V2_FACTORY_ADDRESS = '0xba34aA640b8Be02A439221BCbea1f48c1035EEF9';

const V3_START_BLOCK = 19730499;
const V3_FACTORY_ADDRESS = '0xa1288b64F2378276d0Cc56F08397F70BecF7c0EA';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V2_START_BLOCK) {
    return {};
  }
  let balancesV3 = {};

  const { balances: balancesV2 } = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  if (block >= V3_START_BLOCK) {
    balancesV3 = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
      'algebra',
    );
  }

  const balances = formatter.sum([balancesV2, balancesV3]);

  return { balances };
}

export { tvl };
