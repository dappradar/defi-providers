import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import uniswapV3 from '../../../../util/calculators/uniswapV3';
import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';

const V2_START_BLOCK = 61787381;
const V3_START_BLOCK = 61864971;

const SUBGRAPH_ENDPOINT_V2 = `https://api.studio.thegraph.com/query/76181/exchangev2-polygon/version/latest`;
const SUBGRAPH_ENDPOINT_V3 = `https://api.studio.thegraph.com/query/76181/exchangev3-polygon/version/latest`;

const QUERY_SIZE = 1000;
const TOKENS = gql`
  query getTokens($id: String!, $block: Int!) {
    tokens(
      block: { number: $block }
      first: ${QUERY_SIZE}
      orderBy: id
      where: { id_gt: $id }
    ) {
      id
      decimals
      totalLiquidity
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider } = params;
  if (block < V2_START_BLOCK) {
    return {};
  }
  const balancesV2 = {};
  let balancesV3: any = {};

  let lastId = '';
  while (true) {
    const requestResult: any = await request(SUBGRAPH_ENDPOINT_V2, TOKENS, {
      block: block - 100,
      id: lastId,
    });

    for (const token of requestResult.tokens) {
      balancesV2[token.id.toLowerCase()] = BigNumber(
        token.totalLiquidity,
      ).shiftedBy(Number(token.decimals));
    }

    if (requestResult.tokens.length < QUERY_SIZE) {
      break;
    }

    lastId = requestResult.tokens[requestResult.tokens.length - 1].id;
  }

  if (block >= V3_START_BLOCK) {
    balancesV3 = await uniswapV3.getTvlFromSubgraph(
      SUBGRAPH_ENDPOINT_V3,
      block,
      chain,
      provider,
    );
  }

  const balances = formatter.sum([balancesV2, balancesV3.balances]);

  return { balances };
}

export { tvl };
