import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import SERUM_POOLS from './poolInfos.json';
import { log } from '../../../../util/logger/logger';

async function getTokenAccountBalance(account, web3) {
  try {
    const tokenBalance = await web3.eth.call('getTokenAccountBalance', [
      account,
    ]);
    return tokenBalance.value;
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getTokenAccountBalance of solana/serum`,
      endpoint: 'getTokenAccountBalance',
    });
    return 0;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};
  const length = SERUM_POOLS.length;

  for (let i = 0; i < length; i += 30) {
    const subPools = SERUM_POOLS.slice(i, i + 30);
    const reserveAResults = await Promise.all(
      subPools.map((pool) => getTokenAccountBalance(pool.reserveA, web3)),
    );
    const reserveBResults = await Promise.all(
      subPools.map((pool) => getTokenAccountBalance(pool.reserveB, web3)),
    );

    subPools.forEach((pool, index) => {
      const tokenA = pool.tokenAccountA;
      const tokenB = pool.tokenAccountB;
      const balanceA = BigNumber(reserveAResults[index].amount);
      const balanceB = BigNumber(reserveBResults[index].amount);
      if (!balances[tokenA]) {
        balances[tokenA] = balanceA;
      } else {
        balances[tokenA] = balances[tokenA].plus(balanceA);
      }
      if (!balances[tokenB]) {
        balances[tokenB] = balanceB;
      } else {
        balances[tokenB] = balances[tokenB].plus(balanceB);
      }
    });
  }

  for (const token in balances) {
    balances[token] = balances[token].toFixed();
  }
  return { balances };
}

export { tvl };
