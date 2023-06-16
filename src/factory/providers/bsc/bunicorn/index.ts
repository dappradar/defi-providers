import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import BPOOL_ABI from './abi/bpool.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { log } from '../../../../util/logger/logger';

const FACTORY_ADDRESS = '0x86873f85Bc12ce40321340392C0ff39C3Bdb8D68';
const BFACTORY_ADDRESS = '0x48ab312150E1802D57639859d7C3107aE751FE35';
const START_BLOCK = 8973039;
const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/bunicorndefi/buni-stablecoins';
const QUERY_SIZE = 400;
const POOL_VOLUMES_QUERY = (block = null) => gql`
  query getPoolVolumes($pairs: [ID!]) {
    pairs(
      where: { pools_: { id_in: $pairs } },
      ${block ? `block: {number: ${block}},` : ''}
      first: 400
    ) {
      pools {
        id
      }
      token0 {
        decimals
      }
      token1 {
        decimals
      }
      volumeToken0
      volumeToken1
      volumeUSD
    }
  }
`;
let _pools;

async function getTokens(pool, index, block, web3) {
  try {
    if (!_pools.tokens[pool] || index == new Date().getHours() % 12) {
      const contract = new web3.eth.Contract(BPOOL_ABI, pool);
      const tokens = await contract.methods
        .getCurrentTokens()
        .call(null, block);
      _pools.tokens[pool] = tokens.map((token) => token.toLowerCase());
    }
  } catch {
    return null;
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 8971337) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
    true,
  );

  try {
    _pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {
    _pools = {
      start: START_BLOCK,
      pools: [],
      tokens: {},
    };
  }

  if (!_pools.pools) {
    _pools.pools = [];
  }
  if (!_pools.tokens) {
    _pools.tokens = {};
  }

  let pools = [];
  let offset = 10000;
  let i = Math.max(_pools.start, START_BLOCK);
  while (true) {
    if (i >= block) {
      break;
    }
    console.log(`Checking log from ${i} with offset ${offset}`);
    try {
      const poolLogs = (
        await util.getLogs(
          i,
          Math.min(i + offset, block),
          '0x8ccec77b0cb63ac2cafd0f5de8cdfadab91ce656d262240ba8a6343bccc5f945',
          BFACTORY_ADDRESS,
          web3,
        )
      ).output;

      const newPools = poolLogs.map((poolLog) => {
        return `0x${poolLog.topics[2].slice(26)}`.toLowerCase();
      });
      pools = pools
        .concat(newPools)
        .filter((pool) => !_pools.pools.includes(pool));
      if (offset < 200) {
        offset += 20;
      } else if (offset < 2000) {
        offset += 200;
      } else {
        offset += 2000;
      }
      i += offset;
    } catch {
      if (offset > 2000) {
        offset -= 2000;
      } else if (offset > 200) {
        offset -= 200;
      } else if (offset > 20) {
        offset -= 20;
      } else {
        break;
      }
    }
  }

  pools = _pools.pools.concat(
    pools.filter((pool) => !_pools.pools.includes(pool)),
  );

  const poolLength = pools.length;
  const counts = Math.ceil(poolLength / 12);

  for (i = 0; i < poolLength; i += 300) {
    const end = Math.min(i + 300, poolLength);
    const subPools = pools.slice(i, end);
    const poolCalls = subPools.map((pool, index) =>
      getTokens(pool, Math.floor((i + index) / counts), block, web3),
    );
    await Promise.all(poolCalls);
    console.log(`done ${end} out of ${poolLength}`);
  }

  basicUtil.savedIntoCache(
    {
      start: Math.max(_pools.start, block),
      pools,
      tokens: _pools.tokens,
    },
    'cache/pools.json',
    chain,
    provider,
  );

  const poolPairs = [];
  for (const pool in _pools.tokens) {
    const poolTokens = _pools.tokens[pool];
    if (poolTokens) {
      poolTokens.forEach((token) => {
        poolPairs.push({ pool, token });
      });
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
          detail: `Error: getBalances of bsc/bunicorn`,
          endpoint: 'tvl',
        });
      }
      console.log(`done ${end} out of ${poolPairLength}`);
    }

    const bulkBalances = await Promise.all(balanceCalls);

    for (const bulkBalance of bulkBalances) {
      formatter.sumMultiBalanceOf(balances, bulkBalance, chain, provider);
    }
  }

  formatter.convertBalancesToFixed(balances);

  //

  return { balances, poolBalances };
}

async function getPoolVolumes(pools, priorBlockNumber) {
  const poolVolumes = {};

  for (let i = 0; i < pools.length; i += QUERY_SIZE) {
    try {
      const pairData = await request(GRAPHQL_API, POOL_VOLUMES_QUERY(), {
        pairs: pools.slice(i, i + QUERY_SIZE),
      }).then((res) => res.pairs);
      const pairData24hAgo = await request(
        GRAPHQL_API,
        POOL_VOLUMES_QUERY(priorBlockNumber),
        {
          pairs: pools.slice(i, i + QUERY_SIZE),
        },
      ).then((res) => res.pairs);

      pairData.forEach((pair) => {
        poolVolumes[pair.pools[0].id] = {
          volumes: [BigNumber(pair.volumeToken0), BigNumber(pair.volumeToken1)],
          volumeUsd: BigNumber(pair.volumeUSD),
        };
      });
      pairData24hAgo.forEach((pair) => {
        poolVolumes[pair.pools[0].id] = {
          volumes: [
            poolVolumes[pair.pools[0].id].volumes[0]
              .minus(pair.volumeToken0)
              .times(10 ** (pair.token0.decimals || 0)),
            poolVolumes[pair.pools[0].id].volumes[1]
              .minus(pair.volumeToken1)
              .times(10 ** (pair.token1.decimals || 0)),
          ],
          volumeUsd: poolVolumes[pair.pools[0].id].volumeUsd.minus(
            pair.volumeUSD,
          ),
        };
      });
    } catch {}
  }

  return poolVolumes;
}

async function getTokenVolumes(tokens, priorBlockNumber) {
  const tokenVolumes = await uniswapV2.getTokenVolumes(
    GRAPHQL_API,
    QUERY_SIZE,
    tokens,
    priorBlockNumber,
    {
      volume: 'tradeVolume',
      volumeUsd: 'tradeVolumeUSD',
    },
  );

  return tokenVolumes;
}

export { tvl, getPoolVolumes, getTokenVolumes };
