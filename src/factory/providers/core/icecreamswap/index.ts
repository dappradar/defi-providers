import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';

const START_BLOCK = 2838352;
const V3_START_BLOCK = 9212906;
const FACTORY_ADDRESS = '0x9E6d21E759A7A288b80eef94E4737D313D31c13f';
const V3_FACTORY_ADDRESS = '0xa8a3aad4f592b7f30d6514ee9a863a4ceff6531d';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  let balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const v2 = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
    false,
    false,
  );

  if (block >= V3_START_BLOCK) {
    balances = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
      'default',
    );
  }

  balances = formatter.sum([v2.balances, balances]);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances: v2.poolBalances };
}

export { tvl };
