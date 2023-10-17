import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { request, gql } from 'graphql-request';

const START_BLOCK = 2650000;
const COMPOUND_V3_GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/messari/compound-v3-base';
const V3_MARKETS = gql`
  query getMarkets($block: Int) {
    markets(
      block: { number: $block }
      orderBy: totalValueLockedUSD
      orderDirection: desc
    ) {
      inputToken {
        id
      }
      inputTokenBalance
      variableBorrowedTokenBalance
      stableBorrowedTokenBalance
    }
  }
`;

async function addV3MarketBalances(block, balances) {
  const requestResult = await request(COMPOUND_V3_GRAPHQL_API, V3_MARKETS, {
    block: block,
  });
  requestResult.markets.forEach((market) => {
    balances[market.inputToken.id] = BigNumber(
      balances[market.inputToken.id] || 0,
    )
      .plus(market.inputTokenBalance)
      .minus(market.variableBorrowedTokenBalance || 0)
      .minus(market.stableBorrowedTokenBalance || 0);
  });
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = {};

  await addV3MarketBalances(block, balances);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
