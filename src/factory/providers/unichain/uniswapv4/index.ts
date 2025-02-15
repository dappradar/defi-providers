import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV4 from '../../../../util/calculators/uniswapV4';
import CONSTANTS from '../../../../constants/contracts.json';
import BigNumber from 'bignumber.js';

const V4_START_BLOCK = 1;
const V4_POOL_MANAGER_ADDRESS = '0x1F98400000000000000000000000000000000004';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V4_START_BLOCK) {
    return { balances: {} };
  }

  const balances = await uniswapV4.getTvl(
    V4_POOL_MANAGER_ADDRESS,
    V4_START_BLOCK,
    block,
    chain,
    provider,
    web3,
  );

  const ethBalance = await web3.eth.getBalance(V4_POOL_MANAGER_ADDRESS, block);
  balances[CONSTANTS.WMAIN_ADDRESS.unichain] = BigNumber(
    balances[CONSTANTS.WMAIN_ADDRESS.unichain] || 0,
  )
    .plus(ethBalance)
    .toFixed();

  return { balances, poolBalances: {} };
}

export { tvl };
