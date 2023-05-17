import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import basicUtil from '../basicUtil';
import { ITvlReturn } from '../../interfaces/ITvl';
import { log } from '../logger/logger';

const QUERY_SIZE = 400;
const POOLS_QUERY = gql`
  query getPools($block: Int!, $skip: Int!) {
    pools(block: { number: $block }, skip: $skip, first: ${QUERY_SIZE}) {
      id
      token0 {
        id
        decimals
      }
      token1 {
        id
        decimals
      }
      totalValueLockedToken0
      totalValueLockedToken1
    }
  }
`;

async function getPools(
  endpoint: string,
  block: number,
  skip: number,
  chain: string,
  provider: string,
) {
  let data;
  try {
    data = await request(endpoint, POOLS_QUERY, {
      block: block,
      skip: skip,
    });
  } catch (e) {
    try {
      log.warning({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: tvl of ${chain}/${provider}`,
        endpoint: 'uniswapV3.getPools',
      });
      data = await request(endpoint, POOLS_QUERY, {
        block: block - basicUtil.getDelay(chain),
        skip: skip,
      });
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: tvl of ${chain}/${provider}`,
        endpoint: 'tvl',
      });
      return [];
    }
  }
  return data.pools;
}

/**
 * Gets TVL of Uniswap V3 (or it's clone) using subgraph
 *
 * @param endpoint - The URL of Uniswap V3 (or it's clone) subgraph
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @returns The object containing token addresses and their locked values
 *
 */
async function getTvlFromSubgraph(
  endpoint: string,
  block: number,
  chain: string,
  provider: string,
): Promise<ITvlReturn> {
  const balances = {};
  const poolBalances = {};

  try {
    let skip = 0;
    while (true) {
      const pools = await getPools(endpoint, block, skip, chain, provider);

      pools.forEach((pool) => {
        const token0Balance = BigNumber(pool.totalValueLockedToken0).shiftedBy(
          Number(pool.token0.decimals),
        );
        const token1Balance = BigNumber(pool.totalValueLockedToken1).shiftedBy(
          Number(pool.token1.decimals),
        );
        balances[pool.token0.id] = BigNumber(
          balances[pool.token0.id] || 0,
        ).plus(token0Balance);
        balances[pool.token1.id] = BigNumber(
          balances[pool.token1.id] || 0,
        ).plus(token1Balance);

        poolBalances[pool.id.toLowerCase()] = {
          tokens: [pool.token0.id, pool.token1.id],
          balances: [token0Balance.toFixed(), token1Balance.toFixed()],
        };
      });

      if (pools.length < QUERY_SIZE) break;
      skip += QUERY_SIZE;
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: getTvlFromSubgraph`,
      endpoint: 'getTvlFromSubgraph',
    });
    throw e;
  }

  return { balances, poolBalances };
}

export default {
  getTvlFromSubgraph,
};
