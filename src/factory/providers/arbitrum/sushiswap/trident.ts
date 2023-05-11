import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';
import { gql, request } from 'graphql-request';

const GRAPHQL_API_TRIDENT =
  'https://api.thegraph.com/subgraphs/name/sushi-v2/trident-arbitrum';
const TOKENS = gql`
  query get_tokens($block: Int) {
    tokens(
      block: { number: $block }
      first: 1000
      orderBy: liquidityUSD
      orderDirection: desc
      where: { liquidityUSD_gt: 0 }
    ) {
      id
      liquidity
    }
  }
`;
async function trident(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const requestResult = await request(GRAPHQL_API_TRIDENT, TOKENS, {
    block: block,
  });
  const balances = {};
  requestResult.tokens.forEach((token) => {
    if (balances[token.id]) {
      balances[token.id] = BigNumber(token.liquidity)
        .plus(balances[token.id])
        .toFixed();
    } else {
      balances[token.id] = BigNumber(token.liquidity).toFixed();
    }
  });

  for (const token in balances) {
    if (BigNumber(balances[token] || 0).isLessThan(100000)) {
      delete balances[token];
    }
  }

  return { balances };
}

export { trident };
