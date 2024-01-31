import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import formatter from '../../util/formatter';
import { IBalances } from '../../interfaces/ITvl';

const QUERY_SIZE = 1000;
const TOKENS = gql`
  query getTokens($block: Int!, $skip: Int!) {
    tokens(block: { number: $block }, skip: $skip, first: ${QUERY_SIZE} orderBy: _totalValueLockedUSD, orderDirection: desc) {
      id
      _totalSupply
    }
  }
`;
const MAX_SKIP = 3000;

/**
 * Gets TVL of Pancakeswap V3 using subgraph
 *
 * @param endpoint - The URL of Uniswap V3 subgraph
 * @param block - The block number for which data is requested
 * @returns The object containing token addresses and their locked values
 *
 */
async function getTvlFromSubgraph(
  endpoint: string,
  block: number,
): Promise<IBalances> {
  const balances = {};

  const promises = [];
  for (let i = 0; i <= MAX_SKIP; i += QUERY_SIZE) {
    promises.push(
      request(endpoint, TOKENS, {
        block,
        skip: i,
      }),
    );
  }

  const results = await Promise.all(promises);
  for (const result of results) {
    for (const token of result.tokens) {
      balances[token.id.toLowerCase()] = BigNumber(token._totalSupply);
    }
  }
  formatter.convertBalancesToFixed(balances);

  return balances;
}

export default {
  getTvlFromSubgraph,
};
