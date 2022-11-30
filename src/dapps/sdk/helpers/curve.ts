/*==================================================
  Modules
  ==================================================*/

import BigNumber from 'bignumber.js';
import util from '../../sdk/util';
import basicUtil from '../../sdk/helpers/basicUtil';
import FACTORY_ABI from './abi/curveFactoryAbi.json';
import POOL_ABI from './abi/curvePoolAbi.json';

/*==================================================
  Helper Methods
  ==================================================*/

async function getTokens(pools) {
  let poolsTokens = [];
  pools.forEach((pool) =>
    poolsTokens.push(
      util.executeMultiCallsOfTarget(
        pool,
        POOL_ABI,
        ['coins'],
        Array(8).map((x, i) => i),
        null,
      ),
    ),
  );
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
) {
  return getTokens(
    await util
      .executeMultiCallsOfTarget(
        curveFactory,
        FACTORY_ABI,
        method,
        Array(parseInt(chainPoolCount) - parseInt(filePoolCount)).map(
          (x, i) => [filePoolCount + i],
        ),
        null,
      )
      .then((pools) => pools.map((pool) => pool.toLowerCase())),
  );
}

async function getPools(curveFactory, chain, provider) {
  let pools = {};
  let basePools = {};
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}
  try {
    basePools = basicUtil.readDataFromFile(
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
    null,
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
        ),
      ),
    };
    basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);
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
        ),
      ),
    };
    basicUtil.writeDataToFile(
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

/*==================================================
  TVL
  ==================================================*/

async function getTvl(curveFactory, block, chain, provider) {
  const balances = {};

  const pools = await getPools(curveFactory, chain, provider);

  for (const pool in pools) {
    const poolBalances = await util.executeMultiCallsOfTarget(
      pool,
      POOL_ABI,
      ['balances'],
      Array(pools[pool].length).map((x, i) => i.toString()),
      block,
    );

    pools[pool].forEach((token, i) => {
      if (poolBalances[i]) {
        balances[token] = BigNumber(balances[token] || 0).plus(poolBalances[i]);
      }
    });
  }

  return balances;
}

/*==================================================
  Exports
  ==================================================*/

module.exports = {
  getTvl,
};
