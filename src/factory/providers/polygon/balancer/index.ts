import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 15832998;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2';
const POOL_COUNT_QUERY = gql`
  query getPoolCount($block: Int!) {
    balancer(id: 2, block: { number: $block }) {
      poolCount
    }
  }
`;
const POOLS_QUERY = gql`
  query getPools($block: Int!, $skip: Int!) {
    pools(skip: $skip, first: 1000, block: { number: $block }) {
      tokens {
        address
        balance
        decimals
      }
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  // delayed as subgraph was updated and missing last blocks data
  const blockWithDelay = block - 20000;

  const balances = {};

  try {
    let poolCount;
    await request(THEGRAPTH_ENDPOINT, POOL_COUNT_QUERY, {
      block: blockWithDelay,
    }).then((data) => (poolCount = data.balancer.poolCount));

    for (let i = 0; i < poolCount; i += 1000) {
      let pools;
      await request(THEGRAPTH_ENDPOINT, POOLS_QUERY, {
        block: blockWithDelay,
        skip: i,
      }).then((data) => (pools = data.pools));

      pools.forEach((pool) => {
        pool.tokens.forEach((token) => {
          balances[token.address] = BigNumber(
            balances[token.address] || 0,
          ).plus(BigNumber(token.balance).shiftedBy(token.decimals));
        });
      });
    }
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of polygon/balancer`,
      endpoint: 'tvl',
    });
    throw e;
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
