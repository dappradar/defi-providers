import BigNumber from 'bignumber.js';
import MASTERCHEF_ABI from './abis/masterchef.json';
import MAINSTAKING_ABI from './abis/mainstaking.json';
import UNDERLYINGS from './underlyings.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const MASTERCHEF = '0x423D0FE33031aA4456a17b150804aA57fc157d97';
const MAINSTAKING = '0x8B3d9F0017FA369cD8C164D0Cc078bf4cA588aE5';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 11608913) {
    return {};
  }

  let pools = {};
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const poolLength = await util.executeCall(
    MASTERCHEF,
    MASTERCHEF_ABI,
    'poolLength',
    [],
    block,
    chain,
    web3,
  );

  const newPools = Array.from({ length: poolLength }, (_, i) => i).filter(
    (poolId) => !pools[poolId],
  );

  if (newPools.length > 0) {
    const poolTokens = await util.executeMultiCallsOfTarget(
      MASTERCHEF,
      MASTERCHEF_ABI,
      'registeredToken',
      newPools,
      block,
      chain,
      web3,
    );

    poolTokens.forEach((token, index) => {
      if (token) {
        pools[newPools[index]] = token.toLowerCase();
      }
    });

    basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);
  }

  const results = await util.getTokenBalances(
    MASTERCHEF,
    Object.values(pools),
    block,
    chain,
    web3,
  );

  const depositedTokens = results
    .filter((result) => result)
    .map((result) => [
      result.balance.toFixed(),
      UNDERLYINGS.MAINSTAKING[result.token],
    ])
    .filter((result) => result[1]);

  const underlyingBalances = await util.executeMultiCallsOfTarget(
    MAINSTAKING,
    MAINSTAKING_ABI,
    'getDepositTokensForShares',
    depositedTokens,
    block,
    chain,
    web3,
  );

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, [
    ...results
      .filter((result) => result)
      .filter((result) => !UNDERLYINGS.MAINSTAKING[result.token])
      .map((result) => ({
        token: UNDERLYINGS.JOE_LP[result.token] || result.token,
        balance: result.balance,
      })),
    ...underlyingBalances.map((balance, index) => ({
      token: depositedTokens[index][1],
      balance: BigNumber(balance),
    })),
  ]);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  return { balances };
}

export { tvl };
