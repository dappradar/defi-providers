import BigNumber from 'bignumber.js';
import util from '../blockchainUtil';
import basicUtil from '../basicUtil';
import FACTORY_ABI from '../../constants/abi/curveFactoryAbi.json';
import POOL_ABI from '../../constants/abi/curvePoolAbi.json';

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
          block,
          chain,
          web3,
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

async function getTvl(curveFactory, block, chain, provider, web3) {
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

export default { getTvl };
