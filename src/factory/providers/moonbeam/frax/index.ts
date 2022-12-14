import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 1080774;
const PAIR_POOL_FACTORY_ADDRESS = '0x5ca135cb8527d76e932f34b5145575f9d8cbe08e';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    PAIR_POOL_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
