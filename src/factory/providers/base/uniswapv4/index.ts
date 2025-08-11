import { request, gql } from 'graphql-request';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const V4_START_BLOCK = 25350988;
const V4_POOL_MANAGER_ADDRESS = '0x498581fF718922c3f8e6A244956aF099B2652b2b';
const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;
const SUBGRAPH_ENDPOINT =
  'https://gateway.thegraph.com/api/subgraphs/id/EyVpCKTCYz4ncYPSLTAmykRaMj8Bo6oU2X6USwh9Cizn';

const TOKENS = gql`
  query getTokens($block: Int!) {
    tokens(
      block: { number: $block }
      first: 100
      orderBy: totalValueLockedUSD
      orderDirection: desc
    ) {
      id
      totalValueLocked
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < V4_START_BLOCK) {
    return { balances: {} };
  }

  const balances = {};

  try {
    const headers = {
      Authorization: `Bearer ${THE_GRAPH_API_KEY}`,
    };

    const requestResult = await request(
      SUBGRAPH_ENDPOINT,
      TOKENS,
      {
        block: block - 5000,
      },
      headers,
    );

    console.log(`Found ${requestResult.tokens.length} tokens from subgraph`);

    const tokenAddresses = requestResult.tokens.map((token) =>
      token.id.toLowerCase(),
    );

    const tokenBalances = await util.getTokenBalances(
      V4_POOL_MANAGER_ADDRESS,
      tokenAddresses,
      block,
      chain,
      web3,
    );

    formatter.sumMultiBalanceOf(balances, tokenBalances);
  } catch (error) {
    console.log(
      'Subgraph query failed, falling back to empty balances:',
      error,
    );
  }

  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances: {} };
}

export { tvl };
