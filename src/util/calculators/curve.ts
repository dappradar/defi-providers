import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import util from '../blockchainUtil';
import basicUtil from '../basicUtil';
import { IBalances } from '../../interfaces/ITvl';
import FACTORY_ABI from '../../constants/abi/curveFactoryAbi.json';
import POOL_ABI from '../../constants/abi/curvePoolAbi.json';
import abi from '../../constants/abi/curveRegisteryAbi.json';
import ERC20_ABI from '../../constants/abi/erc20.json';

async function getPoolBalance(poolAddress, block, chain, web3) {
  try {
    const poolInfo = {};
    let coins = await util.executeMultiCallsOfTarget(
      poolAddress,
      [abi['coins128']],
      'coins',
      Array.from({ length: 20 }, (v, i) => [i]),
      block,
      chain,
      web3,
    );
    coins = coins.filter((coin) => coin);
    if (coins.length == 0) {
      coins = await util.executeMultiCallsOfTarget(
        poolAddress,
        [abi['coins256']],
        'coins',
        Array.from({ length: 20 }, (v, i) => [i]),
        block,
        chain,
        web3,
      );
      coins = coins.filter((coin) => coin);
    }

    const results = await util.executeCallOfMultiTargets(
      coins,
      ERC20_ABI,
      'balanceOf',
      [poolAddress],
      block,
      chain,
      web3,
    );
    coins.forEach((coin, index) => {
      poolInfo[coin.toLowerCase()] = BigNumber(results[index] || 0);
    });

    return {
      poolAddress,
      poolInfo,
    };
  } catch {
    return null;
  }
}

async function getTokens(pools, block, chain, web3) {
  let poolsTokens = [];

  pools.forEach((pool) => {
    poolsTokens.push(
      util.executeMultiCallsOfTarget(
        pool,
        POOL_ABI,
        'coins',
        Array(8)
          .fill(0)
          .map((x, i) => i),
        block,
        chain,
        web3,
      ),
    );
  });
  poolsTokens = await Promise.all(poolsTokens);

  const poolsWithTokens = {};
  pools.forEach((pool, index) => {
    poolsWithTokens[pool] = poolsTokens[index].filter((token) => token);
    poolsWithTokens[pool] = poolsWithTokens[pool].map((token) =>
      token.toLowerCase(),
    );
  });

  return poolsWithTokens;
}

async function getPoolsWithTokens(
  curveFactory,
  method,
  filePoolCount,
  chainPoolCount,
  block,
  chain,
  web3,
) {
  const pools = await util
    .executeMultiCallsOfTarget(
      curveFactory,
      FACTORY_ABI,
      method,
      Array(parseInt(chainPoolCount) - parseInt(filePoolCount))
        .fill(0)
        .map((x, i) => [filePoolCount + i]),
      block,
      chain,
      web3,
    )
    .then((pools) => pools.map((pool) => pool.toLowerCase()));
  const tokens = await getTokens(pools, block, chain, web3);

  return tokens;
}

async function getPools(curveFactory, block, chain, provider, web3) {
  let pools = {};
  let basePools = {};
  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}
  try {
    basePools = await basicUtil.readFromCache(
      'cache/basePools.json',
      chain,
      provider,
    );
  } catch {}

  const [poolCount, basePoolCount] = await util.executeDifferentCallsOfTarget(
    curveFactory,
    FACTORY_ABI,
    ['pool_count', 'base_pool_count'],
    [[], []],
    block,
    chain,
    web3,
  );

  if (Object.keys(pools).length < poolCount) {
    pools = {
      ...pools,
      ...Object(
        await getPoolsWithTokens(
          curveFactory,
          'pool_list',
          Object.keys(pools).length,
          poolCount,
          block,
          chain,
          web3,
        ),
      ),
    };
    await basicUtil.saveIntoCache(pools, 'cache/pools.json', chain, provider);
  }
  if (Object.keys(basePools).length < basePoolCount) {
    basePools = {
      ...basePools,
      ...Object(
        await getPoolsWithTokens(
          curveFactory,
          'base_pool_list',
          Object.keys(basePools).length,
          basePoolCount,
          block,
          chain,
          web3,
        ),
      ),
    };
    await basicUtil.saveIntoCache(
      basePools,
      'cache/basePools.json',
      chain,
      provider,
    );
  }

  return {
    ...pools,
    ...basePools,
  };
}

/**
 * Gets TVL of Curve (or it's clone) using factory address
 *
 * @param curveFactory - The address of factory
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param provider - the provider folder name
 * @param web3 - The Web3 object
 * @returns The object containing token addresses and their locked values
 *
 */
async function getTvl(
  curveFactory: string,
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
): Promise<IBalances> {
  const balances = {};

  const pools = await getPools(curveFactory, block, chain, provider, web3);
  for (const pool in pools) {
    const poolBalances = await util.executeMultiCallsOfTarget(
      pool,
      POOL_ABI,
      'balances',
      Array(pools[pool].length)
        .fill(0)
        .map((x, i) => i.toString()),
      block,
      chain,
      web3,
    );

    pools[pool].forEach((token, i) => {
      if (poolBalances[i]) {
        balances[token] = BigNumber(balances[token] || 0).plus(poolBalances[i]);
      }
    });
  }

  return balances;
}

export default { getTvl, getPoolBalance };
