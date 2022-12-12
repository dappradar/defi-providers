import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';

const START_BLOCK = 10932295;
const FACTORY_ADDRESS = '0x75e48C954594d64ef9613AeEF97Ad85370F13807';

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
  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
