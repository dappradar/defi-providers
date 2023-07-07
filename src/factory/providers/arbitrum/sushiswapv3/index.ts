import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { gql, request } from 'graphql-request';
import BigNumber from 'bignumber.js';

const START_BLOCK = 75998697;
const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/sushi-v3/v3-arbitrum';
const QUERY_SIZE = 200;
const TOKENS = gql`
  query getTokens($block: Int) {
    tokens(block: {number: $block}, first: ${QUERY_SIZE} orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      decimals
      totalValueLocked
    }
    pools(first: ${QUERY_SIZE}  orderBy: totalValueLockedToken0 orderDirection: desc) {
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

const BASE_TOKEN = {
  '0xa54b8e178a49f8e5405a4d44bb31f496e5564a05': 'coingecko_pepe',
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }
  const requestResult = await request(GRAPHQL_API, TOKENS, {
    block: block,
  });
  const balances = {},
    poolBalances = {};
  requestResult.tokens.forEach((token) => {
    balances[token.id] = BigNumber(token.totalValueLocked)
      .shiftedBy(Number(token.decimals))
      .toFixed();
    if (BASE_TOKEN[token.id]) {
      balances[BASE_TOKEN[token.id]] = BigNumber(
        token.totalValueLocked,
      ).toFixed();
    }
  });
  requestResult.pools.forEach((pool) => {
    poolBalances[pool.id] = {
      tokens: [pool.token0.id, pool.token1.id],
      balances: [
        BigNumber(pool.totalValueLockedToken0)
          .shiftedBy(Number(pool.token0.decimals))
          .toFixed(),
        BigNumber(pool.totalValueLockedToken1)
          .shiftedBy(Number(pool.token1.decimals))
          .toFixed(),
      ],
    };
  });

  return { balances, poolBalances };
}

export { tvl };
