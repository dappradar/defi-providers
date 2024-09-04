import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';

const START_BLOCK = 3200559;
const V2_FACTORY_ADDRESS = '0x420DD381b31aEf6683db6B902084cB0FFECe40Da';
const V3_START_BLOCK = 13843704;
const V3_FACTORY_ADDRESS = '0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  let balances: any;

  const v2 = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
    true,
  );

  if (block >= V3_START_BLOCK) {
    balances = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
      'aerodrome',
    );
  }

  balances = formatter.sum([v2.balances, balances]);
  return { balances, poolBalances: v2.poolBalances };
}

export { tvl };
