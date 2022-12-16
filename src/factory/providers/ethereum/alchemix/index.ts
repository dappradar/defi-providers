import BigNumber from 'bignumber.js';
import POOL_ABI from './abi.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESS = '0xab8e74017a8cc7c15ffccd726603790d26d7deca';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const ETH_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 11755954) {
    return {};
  }

  let pools = [];
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const contract = new web3.eth.Contract(POOL_ABI, POOL_ADDRESS);
  const poolCount = await contract.methods.poolCount().call(null, block);
  const tokenBalances = {};

  const newPools = await util.executeMultiCallsOfTarget(
    POOL_ADDRESS,
    POOL_ABI,
    'getPoolToken',
    Array.from({ length: poolCount - pools.length }, (v, i) => [
      pools.length + i,
    ]),
    block,
    chain,
    web3,
  );

  for (const pool of newPools) {
    if (pool) {
      pools.push(pool.toLowerCase());
    } else {
      break;
    }
  }

  basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);

  const balanceResults = await util.executeMultiCallsOfTarget(
    POOL_ADDRESS,
    POOL_ABI,
    'getPoolTotalDeposited',
    Array.from({ length: pools.length }, (v, i) => [i]),
    block,
    chain,
    web3,
  );

  balanceResults.forEach((result, index) => {
    if (result) {
      const balance = BigNumber(result);
      if (balance.isGreaterThan(0)) {
        const token = pools[index] == ETH_ADDRESS ? WETH_ADDRESS : pools[index];
        if (!tokenBalances[token]) {
          tokenBalances[token] = BigNumber(0);
        }

        tokenBalances[token] = tokenBalances[token].plus(balance);
      }
    }
  });

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
