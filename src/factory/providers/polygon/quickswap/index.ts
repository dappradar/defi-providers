import { request, gql } from 'graphql-request';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 15474436;
const FACTORY_ADDRESS = '0x5757371414417b8c6caad45baef941abc7d3ab32';
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap-v3';
const QUERY_SIZE = 400;
const TOKENS_QUERY = gql`
  query getTokens($block: Int!, $skip: Int!) {
    tokens(block: { number: $block }, skip: $skip, first: ${QUERY_SIZE}) {
      id
      decimals
      totalValueLocked
    }
  }
`;
const POOLS_QUERY = gql`
  query getPools($block: Int!) {
    pools(
      block: { number: $block }
      orderBy: totalValueLockedUSD
      orderDirection: desc
      first: 100
    ) {
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

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  let skip = 0;
  while (true) {
    try {
      const tokens = await request(THEGRAPTH_ENDPOINT, TOKENS_QUERY, {
        block: block,
        skip: skip,
      }).then((data) => data.tokens);

      tokens.forEach((token) => {
        balances[token.id] = BigNumber(balances[token.id] || 0)
          .plus(
            BigNumber(token.totalValueLocked).shiftedBy(
              parseInt(token.decimals),
            ),
          )
          .toFixed();
      });

      if (tokens.length < QUERY_SIZE) {
        break;
      }
      skip += QUERY_SIZE;
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: tvl of polygon/quickswap`,
        endpoint: 'tvl',
      });
      throw e;
    }
  }

  const pools = await request(THEGRAPTH_ENDPOINT, POOLS_QUERY, {
    block: block,
  }).then((data) => data.pools);
  pools.forEach((pool) => {
    poolBalances[pool.id] = {
      tokens: [pool.token0.id, pool.token1.id],
      balances: [
        BigNumber(pool.totalValueLockedToken0)
          .shiftedBy(parseInt(pool.token0.decimals))
          .toFixed(),
        BigNumber(pool.totalValueLockedToken1)
          .shiftedBy(parseInt(pool.token1.decimals))
          .toFixed(),
      ],
    };
  });

  formatter.convertBalancesToFixed(balances);
  return { balances, poolBalances };
}

export { tvl };
