import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 50404;
const FACTORY_ADDRESS = '0x71f7bbbb33550fa5d70ca3f7eead87529f2dc3c8';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const tokenBalances = await util.getTokenBalances(
    '0x45c550dc634bcc271c092a20d36761d3bb834e5d',
    [
      '0x73d22d8a2D1f59Bf5Bcf62cA382481a2073FAF58',
      '0x1c0491E3396AD6a35f061c62387a95d7218FC515',
      '0x5F795bb52dAC3085f578f4877D450e2929D2F13d',
      '0xD05C4be5f3be302d376518c9492EC0147Fa5A718',
    ],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
