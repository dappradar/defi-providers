import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import basicUtil from '../basicUtil';
import { IBalances } from '../../interfaces/ITvl';

const QUERY_SIZE = 400;
const POOLS_QUERY = gql`
  query getPools($block: Int!, $skip: Int!) {
    pools(block: { number: $block }, skip: $skip, first: ${QUERY_SIZE}) {
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

async function getPools(endpoint, block, skip, chain) {
  let pools;
  try {
    pools = await request(endpoint, POOLS_QUERY, {
      block: block,
      skip: skip,
    }).then((data) => data.pools);
  } catch {
    pools = getPools(endpoint, block - basicUtil.getDelay(chain), skip, chain);
  }
  return pools;
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
): Promise<IBalances> {
  const balances = {};

  try {
    let skip = 0;
    while (true) {
      const pools = await getPools(endpoint, block, skip, chain);

      pools.forEach((pool) => {
        balances[pool.token0.id] = BigNumber(
          balances[pool.token0.id] || 0,
        ).plus(
          BigNumber(pool.totalValueLockedToken0).shiftedBy(
            Number(pool.token0.decimals),
          ),
        );
        balances[pool.token1.id] = BigNumber(
          balances[pool.token1.id] || 0,
        ).plus(
          BigNumber(pool.totalValueLockedToken1).shiftedBy(
            Number(pool.token1.decimals),
          ),
        );
      });

      if (pools.length < QUERY_SIZE) break;
      skip += QUERY_SIZE;
    }
  } catch (e) {
    console.log(e);
    throw e;
  }

  return balances;
}

export default {
  getTvlFromSubgraph,
};
