import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';

const START_BLOCK = 34130751;
const V3_START_BLOCK = 34184408;
const V3_FACTORY_ADDRESS = '0x009c4ef7C0e0Dd6bd1ea28417c01Ea16341367c3';
const SUBGRAPH_ENDPOINT = `https://api.studio.thegraph.com/query/76181/exchangev2/version/latest`;

const QUERY_SIZE = 1000;
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
  const balancesV2 = {};
  let balancesV3 = {};

  let lastId = '';
  while (true) {
    const requestResult = await request(SUBGRAPH_ENDPOINT, TOKENS, {
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
    balancesV3 = await uniswapV3.getTvl(
      V3_FACTORY_ADDRESS,
      V3_START_BLOCK,
      block,
      chain,
      provider,
      web3,
      'algebra',
    );
  }

  const balances = formatter.sum([balancesV2, balancesV3]);

  return { balances };
}

export { tvl };
