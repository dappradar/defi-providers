import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { request, gql } from 'graphql-request';
import formatter from '../../../../util/formatter';

const START_BLOCK = 10000835;
const QUERY_SIZE = 1000;
const SUBGRAPH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v2-dev';
const TOKENS = gql`
  query getTokens($id: String!, $block: Int!) {
    tokens(
      block: { number: $block }
      first: ${QUERY_SIZE}
      orderBy: id
      where: { id_gt: $id tradeVolumeUSD_gt: 100 }
    ) {
      id
      decimals
      totalLiquidity
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};

  let lastId = '';
  while (true) {
    const requestResult = await request(SUBGRAPH_ENDPOINT, TOKENS, {
      block: block,
      id: lastId,
    });

    for (const token of requestResult.tokens) {
      balances[token.id.toLowerCase()] = BigNumber(
        token.totalLiquidity,
      ).shiftedBy(Number(token.decimals));
    }

    if (requestResult.tokens.length < QUERY_SIZE) {
      break;
    }

    lastId = requestResult.tokens[requestResult.tokens.length - 1].id;
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
