import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV4 from '../../../../util/calculators/uniswapV4';
import util from '../../../../util/blockchainUtil';
import BigNumber from 'bignumber.js';

const V4_START_BLOCK = 56195376;
const V4_POOL_MANAGER_ADDRESS = '0x06380c0e0912312b5150364b9dc4542ba0dbbc85';

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

  balances['0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'] =
    balances[util.ZERO_ADDRESS];
  delete balances[util.ZERO_ADDRESS];

  return { balances, poolBalances: {} };
}

export { tvl };
