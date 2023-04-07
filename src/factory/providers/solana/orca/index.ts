import BigNumber from 'bignumber.js';
import ORCA_POOLS from './poolInfos.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';

const WHIRLPOOL_Endpoint = 'https://api.mainnet.orca.so/v1/whirlpool/list';

async function getTokenAccountBalance(account, web3) {
  const tokenBalance = await web3.eth.call('getTokenAccountBalance', [account]);

  try {
    return tokenBalance.value;
  } catch {
    return 0;
  }
}

async function getTokenBalance(token, account, web3) {
  const contract = new web3.eth.Contract(null, token);
  try {
    return await contract.methods.balanceOf(account).call();
  } catch {
    return 0;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;

  const balances = {};
  const length = ORCA_POOLS.length;
  for (let i = 0; i < length; i += 30) {
    const subPools = ORCA_POOLS.slice(i, i + 30);
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

  const poolInfo = (await axios.get(WHIRLPOOL_Endpoint)).data;
  const promisesForTokenBalance = [];
  poolInfo.whirlpools.forEach((pool) => {
    promisesForTokenBalance.push(
      getTokenBalance(pool.tokenA.mint, pool.address, web3),
    );
    promisesForTokenBalance.push(
      getTokenBalance(pool.tokenB.mint, pool.address, web3),
    );
  });
  const results = await Promise.all(promisesForTokenBalance);
  poolInfo.whirlpools.forEach((pool) => {
    if (!balances[pool.tokenA.mint]) {
      balances[pool.tokenA.mint] = BigNumber(results[0]);
    } else {
      balances[pool.tokenA.mint] = balances[pool.tokenA.mint].plus(
        BigNumber(results[0]),
      );
    }
    if (!balances[pool.tokenB.mint]) {
      balances[pool.tokenB.mint] = BigNumber(results[1]);
    } else {
      balances[pool.tokenB.mint] = balances[pool.tokenB.mint].plus(
        BigNumber(results[1]),
      );
    }
    results.splice(0, 2);
  });
  for (const token in balances) {
    if (balances[token]) balances[token] = balances[token].toFixed();
  }

  return { balances };
}

export { tvl };
