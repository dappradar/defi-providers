import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 2398999;
const V2_FACTORY_ADDRESS = '0x18E621B64d7808c3C47bccbbD7485d23F257D26f';
const V3_FACTORY_ADDRESS = '0xD8676fBdfa5b56BB2298D452c9768f51e80e34AE';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  let balances = {};

  const v2 = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  balances = await uniswapV3.getTvl(
    V3_FACTORY_ADDRESS,
    START_BLOCK,
    block,
    chain,
    provider,
    web3,
    true,
  );

  balances = formatter.sum([v2.balances, balances]);

  return { balances };
}

export { tvl };
