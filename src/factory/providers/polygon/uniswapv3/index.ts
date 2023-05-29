import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 22757547;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon';
const QUERY_SIZE = 500;
const TOKENS_QUERY = gql`
  query getTokens($block: Int!, $skip: Int!) {
    tokens(block: { number: $block }, skip: $skip, first: ${QUERY_SIZE}) {
      id
      decimals
      totalValueLocked
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};
  let skip = 0;
  while (skip <= 5000) {
    try {
      const tokens = await request(THEGRAPTH_ENDPOINT, TOKENS_QUERY, {
        block: block,
        skip: skip,
      }).then((data) => data.tokens);

      tokens.forEach((token) => {
        balances[token.id] = BigNumber(token.totalValueLocked).shiftedBy(
          parseInt(token.decimals),
        );
      });

      if (tokens.length < QUERY_SIZE) {
        break;
      }
      skip += QUERY_SIZE;
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: tvl of polygon/uniswapv3`,
        endpoint: 'tvl',
      });
      throw e;
    }
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
