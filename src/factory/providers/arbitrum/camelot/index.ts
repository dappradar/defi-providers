import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 11700000;
const V3_START_BLOCK = 101163738;
const V2_FACTORY_ADDRESS = '0x6EcCab422D763aC031210895C81787E87B43A652';
const V3_FACTORY_ADDRESS = '0x1a3c9B1d2F0529D97f2afC5136Cc23e58f1FD35B';

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

  if (block >= V3_START_BLOCK) {
    balances = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
      true,
    );
  }

  balances = formatter.sum([v2.balances, balances]);

  return { balances };
}

export { tvl };
