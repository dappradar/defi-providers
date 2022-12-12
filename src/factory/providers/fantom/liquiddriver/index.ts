import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import MASTERCHEF_ABI from './abis/masterchef.json';
import HCHEF_ABI from './abis/hchef.json';
import STRATEGY_ABI from './abis/strategy.json';

const MASTERCHEF = '0x742474dae70fa2ab063ab786b1fbe5704e861a0c';
const MINICHEF = '0x6e2ad6527901c9664f016466b8DA1357a004db0f';
const HCHEF_ADDRESSES = [
  '0x79364E45648Db09eE9314E47b2fD31c199Eb03B9',
  '0x9A07fB107b9d8eA8B82ECF453Efb7cFb85A66Ce9',
  '0xeD566B089Fc80Df0e8D3E0AD3aD06116433Bf4a7',
  '0x669F5f289A5833744E830AD6AB767Ea47A3d6409',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 5686982) {
    return {};
  }

  let data = {
    masterchef: {
      pools: [],
    },
    minichef: {
      pools: [],
      strategies: [],
    },
  };

  try {
    data = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const tokenBalances = {};

  try {
    const poolLength = await util.executeCall(
      MASTERCHEF,
      MASTERCHEF_ABI,
      'poolLength',
      [],
      block,
      chain,
      web3,
    );

    if (data.masterchef.pools.length < poolLength) {
      const poolInfos = await util.executeMultiCallsOfTarget(
        MASTERCHEF,
        MASTERCHEF_ABI,
        'poolInfo',
        Array.from(
          { length: poolLength - data.masterchef.pools.length },
          (_, i) => [i + data.masterchef.pools.length],
        ),
        block,
        chain,
        web3,
      );

      poolInfos.forEach((poolInfo) => {
        if (poolInfo) {
          data.masterchef.pools.push(poolInfo.lpToken);
        }
      });

      basicUtil.writeDataToFile(data, 'cache/pools.json', chain, provider);
    }

    const poolBalances = await util.getTokenBalances(
      MASTERCHEF,
      data.masterchef.pools,
      block,
      chain,
      web3,
    );
    formatter.sumMultiBalanceOf(tokenBalances, poolBalances);
  } catch {}

  try {
    const poolLength = await util.executeCall(
      MINICHEF,
      HCHEF_ABI,
      'poolLength',
      [],
      block,
      chain,
      web3,
    );

    if (data.minichef.pools.length < poolLength) {
      const lpTokens = await util.executeMultiCallsOfTarget(
        MINICHEF,
        HCHEF_ABI,
        'lpToken',
        Array.from(
          { length: poolLength - data.minichef.pools.length },
          (_, i) => [i + data.minichef.pools.length],
        ),
        block,
        chain,
        web3,
      );
      const strategies = await util.executeMultiCallsOfTarget(
        MINICHEF,
        HCHEF_ABI,
        'strategies',
        Array.from(
          { length: poolLength - data.minichef.pools.length },
          (_, i) => [i + data.minichef.pools.length],
        ),
        block,
        chain,
        web3,
      );

      lpTokens.forEach((lpToken, index) => {
        if (lpToken && strategies[index]) {
          data.minichef.pools.push(lpToken);
          data.minichef.strategies.push(strategies[index]);
        }
      });

      basicUtil.writeDataToFile(data, 'cache/pools.json', chain, provider);
    }

    const strategyBalances = await util.executeCallOfMultiTargets(
      data.minichef.strategies,
      STRATEGY_ABI,
      'balanceOf',
      [],
      block,
      chain,
      web3,
    );

    const lpTokenBalances = [];
    data.minichef.pools.forEach((lpToken, index) => {
      lpTokenBalances.push({
        token: lpToken,
        balance: BigNumber(strategyBalances[index]),
      });
    });

    formatter.sumMultiBalanceOf(tokenBalances, lpTokenBalances);
  } catch {}

  const [lpTokens, strategies] = await Promise.all([
    util.executeCallOfMultiTargets(
      HCHEF_ADDRESSES,
      HCHEF_ABI,
      'lpToken',
      [0],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      HCHEF_ADDRESSES,
      HCHEF_ABI,
      'strategies',
      [0],
      block,
      chain,
      web3,
    ),
  ]);
  const validLpTokens = lpTokens.filter((lpToken) => lpToken);
  const strategyBalances = await util.executeCallOfMultiTargets(
    strategies.filter((strategy) => strategy),
    STRATEGY_ABI,
    'balanceOf',
    [],
    block,
    chain,
    web3,
  );

  const lpTokenBalances = [];
  validLpTokens.forEach((lpToken, index) => {
    lpTokenBalances.push({
      token: lpToken,
      balance: BigNumber(strategyBalances[index]),
    });
  });

  formatter.sumMultiBalanceOf(tokenBalances, lpTokenBalances);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
