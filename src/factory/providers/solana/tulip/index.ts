import BigNumber from 'bignumber.js';
import TULIP_VAULTS from './tulip_vaults.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
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
      detail: `Error: getTokenAccountBalance of solana/tulip`,
      endpoint: 'getTokenAccountBalance',
    });
    return 0;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  const length = TULIP_VAULTS.length;

  for (let i = 0; i < length; i += 20) {
    const subPools = TULIP_VAULTS.slice(i, i + 20);
    const reserveAResults = await Promise.all(
      subPools.map((pool) => getTokenAccountBalance(pool.reserveA, web3)),
    );
    const reserveBResults = await Promise.all(
      subPools.map((pool) => getTokenAccountBalance(pool.reserveB, web3)),
    );

    subPools.forEach((pool, index) => {
      const tokenA = pool.tokenA;
      const tokenB = pool.tokenB;

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
