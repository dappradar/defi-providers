import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 4576335;
const THEGRAPTH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/denverbaumgartner/bathtokenoptimism';
const POOLS_QUERY = gql`
  query getPools($block: Int!) {
    pools(block: { number: $block }, first: 1000) {
      underlyingToken
      underlyingBalance
    }
  }
`;

async function getPools(block, chain) {
  let pools;
  try {
    pools = await request(THEGRAPTH_ENDPOINT, POOLS_QUERY, {
      block: block,
    }).then((data) => data.pools);
  } catch {
    pools = getPools(block - basicUtil.getDelay(chain), chain);
  }
  return pools;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const pools = await getPools(block, chain);

  pools.forEach((pool) => {
    balances[pool.underlyingToken] = BigNumber(
      balances[pool.underlyingToken] || 0,
    ).plus(BigNumber(pool.underlyingBalance));
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
