import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 2555244;

const THEGRAPTH_ENDPOINT =
  'https://api.studio.thegraph.com/query/24660/balancer-base-v2/version/latest';
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

  const tokenBalances = {};

  try {
    let poolCount;
    await request(THEGRAPTH_ENDPOINT, POOL_COUNT_QUERY, {
      block: block,
    }).then((data) => (poolCount = data.balancer.poolCount));

    for (let i = 0; i < poolCount; i += 1000) {
      let pools;
      await request(THEGRAPTH_ENDPOINT, POOLS_QUERY, {
        block: block,
        skip: i,
      }).then((data) => (pools = data.pools));

      pools.forEach((pool) => {
        pool.tokens.forEach((token) => {
          tokenBalances[token.address] = BigNumber(
            tokenBalances[token.address] || 0,
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

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
