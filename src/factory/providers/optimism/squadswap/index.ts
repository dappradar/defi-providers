import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 125322305;
const V3_START_BLOCK = 125326692;
const V2_FACTORY_ADDRESS = '0xba34aA640b8Be02A439221BCbea1f48c1035EEF9';
const V3_FACTORY_ADDRESS = '0xa1288b64F2378276d0Cc56F08397F70BecF7c0EA';

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
