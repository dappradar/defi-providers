import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV4 from '../../../../util/calculators/uniswapV4';
import BigNumber from 'bignumber.js';
import CONSTANTS from '../../../../constants/contracts.json';

const V4_START_BLOCK = 45970610;
const V4_POOL_MANAGER_ADDRESS = '0x28e2ea090877bf75740558f6bfb36a5ffee9e9df';

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

  const bnbBalance = await web3.eth.getBalance(V4_POOL_MANAGER_ADDRESS, block);
  balances[CONSTANTS.WMAIN_ADDRESS.bsc] = BigNumber(
    balances[CONSTANTS.WMAIN_ADDRESS.bsc],
  )
    .plus(bnbBalance)
    .toFixed();
  return { balances, poolBalances: {} };
}

export { tvl };
