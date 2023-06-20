import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import SHITCOINS from './shitcoins.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import abi from './abi.json';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 9562480;
const POOLS_GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2';
const QUERY_SIZE = 400;
const POOLS_QUERY = gql`
    query getTokens($block: Int!, $skip: Int!) {
      pools(block: { number: $block }, skip: $skip, first: ${QUERY_SIZE}) {
        tokens {
          address
          balance
          decimals
        }
      }
    }
  `;

async function v1Tvl(balances, block, chain, provider, web3) {
  let _pools;

  try {
    _pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {
    _pools = {
      start: START_BLOCK,
      pools: [],
      tokens: {},
    };
  }
  if (!_pools.tokens) {
    _pools.tokens = {};
  }

  const blocksLimit = 10000;
  const poolLogs = [];
  for (
    let i = Math.max(_pools.start, START_BLOCK);
    i < block;
    i += blocksLimit
  ) {
    const logs = (
      await util.getLogs(
        i,
        Math.min(i + blocksLimit, block),
        '0x8ccec77b0cb63ac2cafd0f5de8cdfadab91ce656d262240ba8a6343bccc5f945',
        '0x9424B1412450D0f8Fc2255FAf6046b98213B76Bd',
        web3,
      )
    ).output;
    Array.prototype.push.apply(poolLogs, logs);
  }

  const poolPairs = [];

  let pools = poolLogs.map((poolLog) => {
    return `0x${poolLog.topics[2].slice(26)}`.toLowerCase();
  });
  pools = pools.filter((pool) => !_pools.pools.includes(pool));
  pools = _pools.pools.concat(
    pools.filter((pool) => !SHITCOINS.includes(pool.toLowerCase())),
  );

  const poolLength = pools.length;
  const counts = Math.ceil(poolLength / 12);
  const index = new Date().getHours() % 12;

  const recalcPools = pools.slice(index * counts, (index + 1) * counts);
  const recalcResults = await util.executeCallOfMultiTargets(
    recalcPools,
    [abi['getCurrentTokens']],
    'getCurrentTokens',
    [],
    block,
    chain,
    web3,
  );

  recalcResults.forEach((result, index) => {
    if (result) {
      _pools.tokens[recalcPools[index]] = result.map((token) =>
        token.toLowerCase(),
      );
    }
  });

  const newPools = pools.filter((pool) => !_pools.tokens[pool]);
  const newResults = await util.executeCallOfMultiTargets(
    newPools,
    [abi['getCurrentTokens']],
    'getCurrentTokens',
    [],
    block,
    chain,
    web3,
  );

  newResults.forEach((result, index) => {
    if (result) {
      _pools.tokens[newPools[index]] = result.map((token) =>
        token.toLowerCase(),
      );
    }
  });

  await basicUtil.saveIntoCache(
    {
      start: block,
      pools,
      tokens: _pools.tokens,
    },
    'cache/pools.json',
    chain,
    provider,
  );

  for (const pool in _pools.tokens) {
    const poolTokens = _pools.tokens[pool];
    if (poolTokens) {
      if (!SHITCOINS.includes(pool)) {
        poolTokens.forEach((token) => {
          if (!SHITCOINS.includes(token)) {
            poolPairs.push({ pool, token });
          }
        });
      }
    }
  }

  const poolPairLength = poolPairs.length;
  for (let i = 0; i < poolPairLength; i += 2000) {
    const j = Math.min(i + 2000, poolPairLength);
    const balanceCalls = [];

    for (let start = i; start < j; start += 100) {
      const end = Math.min(start + 100, poolPairLength);
      const subPairs = poolPairs.slice(start, end);
      try {
        balanceCalls.push(
          util.getTokenBalancesOfHolders(
            subPairs.map((pair) => pair.pool),
            subPairs.map((pair) => pair.token),
            block,
            chain,
            web3,
          ),
        );
      } catch (e) {
        log.error({
          message: e?.message || '',
          stack: e?.stack || '',
          detail: `Error: v1Tvl of ethereum/balancer`,
          endpoint: 'v1Tvl',
        });
      }
      log.info({
        message: `done ${end} out of ${poolPairLength}`,
        endpoint: 'v1Tvl of ethereum/balancer',
      });
      console.log(`done ${end} out of ${poolPairLength}`);
    }

    const bulkBalances = await Promise.all(balanceCalls);

    for (const bulkBalance of bulkBalances) {
      formatter.sumMultiBalanceOf(balances, bulkBalance);
    }
  }
}

async function v2Tvl(balances, block) {
  try {
    let skip = 0;
    while (true) {
      try {
        const pools = await request(POOLS_GRAPHQL_API, POOLS_QUERY, {
          block: block,
          skip: skip,
        }).then((data) => data.pools);

        pools.forEach((pool) => {
          pool.tokens.forEach((token) => {
            balances[token.address] = BigNumber(
              balances[token.address] || 0,
            ).plus(
              BigNumber(token.balance).shiftedBy(parseInt(token.decimals)),
            );
          });
        });

        if (pools.length < QUERY_SIZE) {
          break;
        }
        skip += QUERY_SIZE;
      } catch (e) {
        log.error({
          message: e?.message || '',
          stack: e?.stack || '',
          detail: `Error: v2Tvl of ethereum/balancer`,
          endpoint: 'v2Tvl',
        });
        throw e;
      }
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: v2Tvl of ethereum/balancer`,
      endpoint: 'v2Tvl',
    });
    throw e;
  }
}

// AAVE uses wrapped tokens which are not tracked by coingecko. Manual conversion is needed
function convertATokens(balances) {
  const AUSDT = '0x3ed3b47dd13ec9a98b44e6204a523e766b225811';
  const AUSDC = '0xbcca60bb61934080951369a648fb03df4f96263c';
  const ADAI = '0x028171bca77440897b824ca71d1c56cac55b68a3';
  const WrappedAUSDT = '0xf8fd466f12e236f4c96f7cce6c79eadb819abf58';
  const WrappedAUSDC = '0xd093fa4fb80d09bb30817fdcd442d4d02ed3e5de';
  const WrappedADAI = '0x02d60b84491589974263d922d9cc7a3152618ef6';

  balances[AUSDT] = BigNumber(balances[AUSDT] || 0).plus(
    balances[WrappedAUSDT],
  );
  balances[AUSDC] = BigNumber(balances[AUSDC] || 0).plus(
    balances[WrappedAUSDC],
  );
  balances[ADAI] = BigNumber(balances[ADAI] || 0).plus(balances[WrappedADAI]);

  delete balances[WrappedAUSDT];
  delete balances[WrappedAUSDC];
  delete balances[WrappedADAI];
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  await v1Tvl(balances, block, chain, provider, web3);
  await v2Tvl(balances, block);

  convertATokens(balances);

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
