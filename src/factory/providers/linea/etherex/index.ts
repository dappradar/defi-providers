import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import BigNumber from 'bignumber.js';

const START_BLOCK = 21254948;
const V2_FACTORY_ADDRESS = '0xC0b920f6f1d6122B8187c031554dc8194F644592';
const V3_START_BLOCK = 21293324;
const V3_FACTORY_ADDRESS = '0xAe334f70A7FC44FCC2df9e6A37BC032497Cf80f1';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    V2_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const v3Balances = await uniswapV3.getTvl(
    V3_FACTORY_ADDRESS,
    V3_START_BLOCK,
    block,
    chain,
    provider,
    web3,
  );

  for (const [key, value] of Object.entries(v3Balances)) {
    balances[key] = new BigNumber(balances[key] || 0).plus(value).toFixed();
  }
  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
