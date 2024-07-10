import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { request, gql } from 'graphql-request';

const START_BLOCK = 2650000;
const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;
const COMPOUND_V3_GRAPHQL_API = `https://gateway-arbitrum.network.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/99XPkR9F1exRDdCNyfXrCfEon4K34YoTDn6dgXKmxC72`;

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
  let { block } = params;
  block = block - 100;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = {};

  await addV3MarketBalances(block, balances);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
