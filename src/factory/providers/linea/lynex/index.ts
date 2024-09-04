import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const V3_START_BLOCK = 143660;
const V3_FACTORY_ADDRESS = '0x622b2c98123D303ae067DB4925CD6282B3A08D0F';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V3_START_BLOCK) {
    return { balances: {} };
  }

  let balances = await uniswapV3.getTvl(
    V3_FACTORY_ADDRESS,
    V3_START_BLOCK,
    block,
    chain,
    provider,
    web3,
    'algebra',
  );

  const tokenBalances = await util.getTokenBalances(
    '0x8D95f56b0Bac46e8ac1d3A3F12FB1E5BC39b4c0c',
    ['0x1a51b19CE03dbE0Cb44C1528E34a7EDD7771E9Af'],
    block,
    chain,
    web3,
  );

  const v2Tvl1 = await uniswapV2.getTvl(
    '0x6ed7b91c8133e85921f8028b51a8248488b3336c',
    block,
    chain,
    provider,
    web3,
  );

  const v2Tvl2 = await uniswapV2.getTvl(
    '0xbc7695fd00e3b32d08124b7a4287493aee99f9ee',
    block,
    chain,
    provider,
    web3,
  );

  balances = formatter.sum([balances, v2Tvl1.balances, v2Tvl2.balances]);
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances: {} };
}

export { tvl };
