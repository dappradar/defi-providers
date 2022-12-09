import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const SAFE_BOX_API = 'https://homora-api.alphafinance.io/v2/43114/safeboxes';
const POOLS_API = 'https://homora-api.alphafinance.io/v2/43114/pools';
const AXELAR_WUST = '0x260bbf5698121eb85e7a74f2e45e16ce762ebe11';
const USDT = '0xc7198437980c041c805a1edcba50c1ce5db95118';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  if (block < 5658993) {
    return {};
  }

  const [safeBoxes, pools] = await Promise.all([
    fetch(SAFE_BOX_API).then((res) => res.json()),
    fetch(POOLS_API).then((res) => res.json()),
  ]);

  const safeBoxBalances = await util.getTokenBalancesOfHolders(
    safeBoxes.map((box) => box.safeboxAddress),
    safeBoxes.map((box) => box.cyTokenAddress),
    block,
    chain,
    web3,
  );

  const poolsWithPid = pools.filter((pool) => pool.pid != undefined);
  const poolsWithoutPid = pools.filter((pool) => pool.pid == undefined);

  const lpTokenInfos = await util.executeMultiCallsOfMultiTargets(
    poolsWithPid.map(
      (pool) => pool.exchange.stakingAddress ?? pool.stakingAddress,
    ),
    abi,
    'userInfo',
    poolsWithPid.map((pool) => [pool.pid, pool.wTokenAddress]),
    block,
    chain,
    web3,
  );

  const lpPools = [];
  lpTokenInfos.forEach((info, index) => {
    if (info) {
      lpPools.push({
        token: poolsWithPid[index].lpTokenAddress.toLowerCase(),
        balance: BigNumber(info.amount),
      });
    }
  });

  const lpTokenStakedBalances = await util.getTokenBalancesOfHolders(
    poolsWithoutPid.map((pool) => pool.wTokenAddress),
    poolsWithoutPid.map((pool) => pool.stakingAddress),
    block,
    chain,
    web3,
  );

  lpTokenStakedBalances.forEach((info, index) => {
    if (info) {
      lpPools.push({
        token: poolsWithoutPid[index].lpTokenAddress.toLowerCase(),
        balance: info.balance,
      });
    }
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, safeBoxBalances);
  formatter.sumMultiBalanceOf(tokenBalances, lpPools);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  if (balances[AXELAR_WUST]) {
    balances[USDT] = BigNumber(balances[USDT] || 0)
      .plus(balances[AXELAR_WUST])
      .toFixed();
    delete balances[AXELAR_WUST];
  }

  console.log(balances);

  return { balances };
}

export { tvl };
