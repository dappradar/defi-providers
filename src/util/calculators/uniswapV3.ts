import BigNumber from 'bignumber.js';
import { gql } from 'graphql-request';
import basicUtil from '../basicUtil';
import { parse } from 'graphql';
import { print } from 'graphql/language/printer';
import { ITvlReturn } from '../../interfaces/ITvl';
import { log } from '../logger/logger';

const DEFAULT_QUERY_SIZE = 400;

const POOLS_QUERY = (querySize: number) => gql`
  query getPools($block: Int!, $skip: Int!) {
    pools(block: { number: $block }, skip: $skip, first: ${querySize}, orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
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
  querySize: number,
  chain: string,
  provider: string,
) {
  let data;
  try {
    data = (
      await (
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: print(parse(POOLS_QUERY(querySize))),
            variables: { block: block, skip: skip },
          }),
        })
      ).json()
    ).data;
  } catch (e) {
    try {
      log.warning({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: tvl of ${chain}/${provider}`,
        endpoint: 'uniswapV3.getPools',
      });
      data = (
        await (
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: print(parse(POOLS_QUERY(querySize))),
              variables: {
                block: block - basicUtil.getDelay(chain),
                skip: skip,
              },
            }),
          })
        ).json()
      ).data;
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
 * Gets TVL of Uniswap V3 (or its clone) using subgraph
 *
 * @param endpoint - The URL of Uniswap V3 (or its clone) subgraph
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param querySize - Optional query size, defaults to DEFAULT_QUERY_SIZE if not provided
 * @returns The object containing token addresses and their locked values
 *
 */
async function getTvlFromSubgraph(
  endpoint: string,
  block: number,
  chain: string,
  provider: string,
  querySize: number = DEFAULT_QUERY_SIZE,
): Promise<ITvlReturn> {
  const balances = {};
  const poolBalances = {};

  try {
    let skip = 0;
    while (skip <= 5000) {
      const pools = await getPools(
        endpoint,
        block,
        skip,
        querySize,
        chain,
        provider,
      );
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

      if (pools.length < querySize) break;
      skip += querySize;
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
