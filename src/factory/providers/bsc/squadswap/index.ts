import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import uniswapV3 from '../../../../util/calculators/uniswapV3chain';
import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';

// Constants for original versions
const V2_START_BLOCK = 34130751;
const V3_START_BLOCK = 34184408;
const V3_FACTORY_ADDRESS = '0x009c4ef7C0e0Dd6bd1ea28417c01Ea16341367c3';
const V2_SUBGRAPH_ENDPOINT = `https://api.studio.thegraph.com/query/76181/exchangev2/version/latest`;

// Constants for new versions
const DYNAMO_START_BLOCK = 46188894;
const WOW_START_BLOCK = 46190543;
const WOW_FACTORY_ADDRESS = '0x10d8612D9D8269e322AB551C18a307cB4D6BC07B';
const DYNAMO_SUBGRAPH_ENDPOINT = `https://api.studio.thegraph.com/query/76181/exchangev2-wd/version/latest`;

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

async function fetchTokenBalances(endpoint: string, block: number) {
  const balances = {};
  let lastId = '';

  while (true) {
    const requestResult = await request(endpoint, TOKENS, {
      block: block - 100,
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

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V2_START_BLOCK) {
    return {};
  }

  // Original V2 (SquadSwap) balances
  const balancesV2 =
    block >= V2_START_BLOCK
      ? await fetchTokenBalances(V2_SUBGRAPH_ENDPOINT, block)
      : {};

  // Original V3 (SquadSwap) balances
  let balancesV3 = {};
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

  // New V2 (Dynamo) balances
  const balancesDynamo =
    block >= DYNAMO_START_BLOCK
      ? await fetchTokenBalances(DYNAMO_SUBGRAPH_ENDPOINT, block)
      : {};

  // New V3 (WOW) balances
  let balancesWow = {};
  if (block >= WOW_START_BLOCK) {
    balancesWow = await uniswapV3.getTvl(
      WOW_FACTORY_ADDRESS,
      WOW_START_BLOCK,
      block,
      chain,
      provider,
      web3,
      'algebra',
    );
  }

  // Combine all balances
  const balances = formatter.sum([
    balancesV2,
    balancesV3,
    balancesDynamo,
    balancesWow,
  ]);

  return { balances };
}

export { tvl };
