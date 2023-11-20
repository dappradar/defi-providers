import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 2274490;
const FACTORY_ADDRESS = '0x326Ee96748E7DcC04BE1Ef8f4E4F6bdd54048932';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
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
