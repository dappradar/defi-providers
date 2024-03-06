import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';

const START_BLOCK = 34130751;
const FACTORY_ADDRESS = '0x1D9F43a6195054313ac1aE423B1f810f593b6ac1';

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
