import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function getTokenAccountBalance(account, web3) {
  try {
    const tokenBalance = await web3.eth.call('getTokenAccountBalance', [
      account,
    ]);
    return tokenBalance.value;
  } catch {
    return 0;
  }
}

const RAYDIUM_POOLS_ENDPOINT =
  'https://api.raydium.io/v2/sdk/liquidity/mainnet.json';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};
  const pools = await fetch(RAYDIUM_POOLS_ENDPOINT).then((res) => res.json());
  const RAYDIUM_POOLS = pools.official;

  const length = RAYDIUM_POOLS.length;

  for (let i = 0; i < length; i += 30) {
    const subPools = RAYDIUM_POOLS.slice(i, i + 30);
    const reserveAResults = await Promise.all(
      subPools.map((pool) =>
        getTokenAccountBalance(pool.marketBaseVault, web3),
      ),
    );
    const reserveBResults = await Promise.all(
      subPools.map((pool) =>
        getTokenAccountBalance(pool.marketQuoteVault, web3),
      ),
    );

    subPools.forEach((pool, index) => {
      const tokenA = pool.baseMint;
      const tokenB = pool.quoteMint;
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
