import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const START_BLOCK = 2210711;
const POOLS_URI = 'https://config.mainnet.plenty.network/pools';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};
  const poolBalances = {};

  const pools: object = await fetch(POOLS_URI).then((res) => res.json());

  for (const [, pool] of Object.entries(pools)) {
    let tokenBalances: { token: string; balance: BigNumber }[];
    let xtzBalance: BigNumber;
    try {
      [tokenBalances, xtzBalance] = await Promise.all([
        web3.eth.getAllTokensBalances(pool.address, block),
        web3.eth.getBalance(pool.address, block),
      ]);
    } catch {}
    if (xtzBalance.isGreaterThan(0)) {
      balances['xtz'] = BigNumber(balances['xtz'] || 0).plus(xtzBalance);
    }

    formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);

    poolBalances[pool.address] = {
      tokens: [],
      balances: [],
    };
    if (xtzBalance.gt(0)) {
      poolBalances[pool.address].tokens.push('xtz');
      poolBalances[pool.address].balances.push(xtzBalance.toFixed());
    }
    tokenBalances.forEach((tokenBalance) => {
      poolBalances[pool.address].tokens.push(tokenBalance.token);
      poolBalances[pool.address].balances.push(tokenBalance.balance.toFixed());
    });
  }

  return { balances, poolBalances };
}

export { tvl };
