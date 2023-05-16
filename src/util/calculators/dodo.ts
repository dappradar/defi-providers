import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import basicUtil from '../basicUtil';
import { ITvlReturn } from '../../interfaces/ITvl';
import { log } from '../logger/logger';
import formatter from '../formatter';

const QUERY_SIZE = 100;
const PAIRS_QUERY = gql`
  query getPairs($block: Int, $lastId: String, $querySize: Int) {
    pairs(
      block: { number: $block }
      where: { id_gt: $lastId }
      first: $querySize
    ) {
      id
      baseReserve
      quoteReserve
      baseToken {
        id
        decimals
      }
      quoteToken {
        id
        decimals
      }
    }
  }
`;

async function getPairs(endpoint, block, lastId, chain) {
  let pairs;
  try {
    pairs = await request(endpoint, PAIRS_QUERY, {
      block,
      lastId,
      querySize: QUERY_SIZE,
    }).then((data) => data.pairs);
  } catch {
    pairs = getPairs(
      endpoint,
      block - basicUtil.getDelay(chain),
      lastId,
      chain,
    );
  }
  return pairs;
}

/**
 * Gets TVL of Dodo using subgraph
 *
 * @param endpoint - The URL of Dodo subgraph
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @returns The object containing token addresses and their locked values
 *
 */
async function getTvlFromSubgraph(
  endpoint: string,
  block: number,
  chain: string,
): Promise<ITvlReturn> {
  const balances = {};
  const poolBalances = {};

  try {
    let lastId = '';
    while (true) {
      const pairs = await getPairs(endpoint, block, lastId, chain);

      pairs.forEach((pair) => {
        if (pair.baseReserve != '0' || pair.quoteReserve != '0') {
          const token0Id = pair.baseToken.id.toLowerCase();
          const token1Id = pair.quoteToken.id.toLowerCase();

          const token0Balance = BigNumber(pair.baseReserve).shiftedBy(
            Number(pair.baseToken.decimals),
          );
          const token1Balance = BigNumber(pair.quoteReserve).shiftedBy(
            Number(pair.quoteToken.decimals),
          );

          balances[token0Id] = BigNumber(balances[token0Id] || 0).plus(
            token0Balance,
          );
          balances[token1Id] = BigNumber(balances[token1Id] || 0).plus(
            token1Balance,
          );

          poolBalances[pair.id.toLowerCase()] = {
            tokens: [token0Id, token1Id],
            balances: [token0Balance.toFixed(), token1Balance.toFixed()],
          };
        }
      });

      if (pairs.length < QUERY_SIZE) break;
      lastId = pairs[pairs.length - 1].id;
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

  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export default {
  getTvlFromSubgraph,
};
