import BigNumber from 'bignumber.js';
import { gql, request } from 'graphql-request';
import { log } from '../logger/logger';

/**
 * SquadSwap serves every version from its own subgraph, so volumes have to be
 * collected per version and merged by the provider.
 *
 * The uniswapV2 calculator already covers the v2 schema (dynamo), these
 * functions cover the two schemas it does not: the v3 one (wow) and thanos,
 * which keeps its pools on two separate pool managers.
 */

const V3_POOL_VOLUMES_QUERY = (querySize: number, block = null) => gql`
  query getPoolVolumes($pools: [ID!]) {
    pools(
      where: { id_in: $pools },
      ${block ? `block: {number: ${block}},` : ''}
      first: ${querySize}
    ) {
      id
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

const THANOS_POOL_VOLUMES_QUERY = (querySize: number, block = null) => gql`
  query getPoolVolumes($pools: [ID!]) {
    clpools(
      where: { id_in: $pools },
      ${block ? `block: {number: ${block}},` : ''}
      first: ${querySize}
    ) {
      id
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
    binPools(
      where: { id_in: $pools },
      ${block ? `block: {number: ${block}},` : ''}
      first: ${querySize}
    ) {
      id
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

const TOKEN_VOLUMES_QUERY = (querySize: number, block = null) => gql`
  query getTokenVolumes($tokens: [ID!]) {
    tokens(
      where: { id_in: $tokens },
      ${block ? `block: {number: ${block}},` : ''}
      first: ${querySize}
    ) {
      id
      decimals
      volume
      volumeUSD
    }
  }
`;

interface IPoolVolumes {
  [key: string]: {
    volumes: string[];
    volumeUsd: string;
  };
}

interface ITokenVolumes {
  [key: string]: {
    volume: string;
    volumeUsd: string;
  };
}

function sumPoolVolumes(
  poolVolumes: IPoolVolumes,
  currentPools,
  priorPools,
): void {
  currentPools.forEach((pool) => {
    poolVolumes[pool.id] = {
      volumes: [BigNumber(pool.volumeToken0), BigNumber(pool.volumeToken1)],
      volumeUsd: BigNumber(pool.volumeUSD),
    };
  });
  priorPools.forEach((pool) => {
    if (!poolVolumes[pool.id]) {
      return;
    }
    poolVolumes[pool.id] = {
      volumes: [
        poolVolumes[pool.id].volumes[0]
          .minus(pool.volumeToken0)
          .times(10 ** (pool.token0.decimals || 0)),
        poolVolumes[pool.id].volumes[1]
          .minus(pool.volumeToken1)
          .times(10 ** (pool.token1.decimals || 0)),
      ],
      volumeUsd: poolVolumes[pool.id].volumeUsd.minus(pool.volumeUSD),
    };
  });
}

async function getPoolVolumes(
  queryApi: string,
  querySize: number,
  pools: string[],
  priorBlockNumber: number,
  query: (querySize: number, block?: number) => string,
  pickPools: (response) => unknown[],
): Promise<IPoolVolumes> {
  const poolVolumes = {};

  for (let i = 0; i < pools?.length || 0; i += querySize) {
    const requestedPools = pools.slice(i, i + querySize);
    try {
      const currentPools = await request(queryApi, query(querySize), {
        pools: requestedPools,
      }).then(pickPools);
      const priorPools = await request(
        queryApi,
        query(querySize, priorBlockNumber),
        { pools: requestedPools },
      ).then(pickPools);

      sumPoolVolumes(poolVolumes, currentPools, priorPools);
    } catch (e) {
      log.warning({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: getPoolVolumes`,
        endpoint: 'getPoolVolumes',
      });
    }
  }

  return poolVolumes;
}

/**
 * Gets pool volumes of a Uniswap V3 like SquadSwap version (wow)
 */
async function getV3PoolVolumes(
  queryApi: string,
  querySize: number,
  pools: string[],
  priorBlockNumber: number,
): Promise<IPoolVolumes> {
  return getPoolVolumes(
    queryApi,
    querySize,
    pools,
    priorBlockNumber,
    V3_POOL_VOLUMES_QUERY,
    (response) => response.pools,
  );
}

/**
 * Gets pool volumes of Thanos, whose pools are split between the CL and the
 * Bin pool manager
 */
async function getThanosPoolVolumes(
  queryApi: string,
  querySize: number,
  pools: string[],
  priorBlockNumber: number,
): Promise<IPoolVolumes> {
  return getPoolVolumes(
    queryApi,
    querySize,
    pools,
    priorBlockNumber,
    THANOS_POOL_VOLUMES_QUERY,
    (response) => [...response.clpools, ...response.binPools],
  );
}

/**
 * Gets token volumes of the SquadSwap versions using the `volume` and
 * `volumeUSD` token fields, which both the v3 and the thanos subgraphs share
 */
async function getTokenVolumes(
  queryApi: string,
  querySize: number,
  tokens: string[],
  priorBlockNumber: number,
): Promise<ITokenVolumes> {
  const tokenVolumes = {};

  for (let i = 0; i < tokens?.length || 0; i += querySize) {
    const requestedTokens = tokens.slice(i, i + querySize);
    try {
      const currentTokens = await request(
        queryApi,
        TOKEN_VOLUMES_QUERY(querySize),
        { tokens: requestedTokens },
      ).then((response) => response.tokens);
      const priorTokens = await request(
        queryApi,
        TOKEN_VOLUMES_QUERY(querySize, priorBlockNumber),
        { tokens: requestedTokens },
      ).then((response) => response.tokens);

      currentTokens.forEach((token) => {
        tokenVolumes[token.id] = {
          volume: BigNumber(token.volume),
          volumeUsd: BigNumber(token.volumeUSD),
        };
      });
      priorTokens.forEach((token) => {
        if (!tokenVolumes[token.id]) {
          return;
        }
        tokenVolumes[token.id] = {
          volume: tokenVolumes[token.id].volume
            .minus(token.volume)
            .times(10 ** (token.decimals || 0)),
          volumeUsd: tokenVolumes[token.id].volumeUsd.minus(token.volumeUSD),
        };
      });
    } catch (e) {
      log.warning({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: getTokenVolumes`,
        endpoint: 'getTokenVolumes',
      });
    }
  }

  return tokenVolumes;
}

export default {
  getV3PoolVolumes,
  getThanosPoolVolumes,
  getTokenVolumes,
};
