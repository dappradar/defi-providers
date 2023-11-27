import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import BigNumber from 'bignumber.js';

const START_BLOCK = 2344;
const V2_FACTORY_ADDRESS = '0x6D1063F2187442Cc9adbFAD2f55A96B846FCB399';
const V3_START_BLOCK = 120029;
const V3_FACTORY_ADDRESS = '0x559Fa53Be355835a038aC303A750E8788668636B';

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
