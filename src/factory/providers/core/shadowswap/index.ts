import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 2274490;
const FACTORY_ADDRESS = '0x326Ee96748E7DcC04BE1Ef8f4E4F6bdd54048932';
const STAKING_ADDRESS = '0xc19e65B5140B521530E403baA3DEdA62c929f368';
const SHADOW_SWAP_ADDRESS = '0xddba66c1eba873e26ac0215ca44892a07d83adf5';

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

  const tokenBalances = await util.getTokenBalances(
    STAKING_ADDRESS,
    [SHADOW_SWAP_ADDRESS],
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);

  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
