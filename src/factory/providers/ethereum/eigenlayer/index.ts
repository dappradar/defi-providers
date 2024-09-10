import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { request, gql } from 'graphql-request';
import formatter from '../../../../util/formatter';

const START_BLOCK = 17445564;
const SWETH = '0xf951e335afb289353dc249e82926178eac7ded78';

const THE_GRAPH_API_KEY = process.env?.THE_GRAPH_API_KEY;
const SUBGRAPH_ENDPOINT = `https://gateway-arbitrum.network.thegraph.com/api/${THE_GRAPH_API_KEY}/subgraphs/id/68g9WSC4QTUJmMpuSbgLNENrcYha4mPmXhWGCoupM7kB`;

const STRATEGY_POOLS = gql`
  query getPools($block: Int!) {
    protocols(block: { number: $block }) {
      totalEigenPodCount
    }
    pools(block: { number: $block }, where: { type: STRATEGY }) {
      inputTokens {
        id
      }
      inputTokenBalances
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { chain, provider, web3 } = params;
  const block = params.block - 10;

  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};

  const requestResult = await request(SUBGRAPH_ENDPOINT, STRATEGY_POOLS, {
    block: block,
  });

  balances['eth'] = BigNumber(
    requestResult.protocols[0].totalEigenPodCount * 38,
  ).shiftedBy(18);

  for (const pool of requestResult.pools) {
    for (let i = 0; i < pool.inputTokens.length; i++) {
      balances[pool.inputTokens[i].id.toLowerCase()] = BigNumber(
        balances[pool.inputTokens[i].id.toLowerCase()] || 0,
      ).plus(BigNumber(pool.inputTokenBalances[i]));
    }
  }
  if (balances[SWETH]) {
    balances['eth'] = BigNumber(balances['eth']).plus(balances[SWETH]);
    delete balances[SWETH];
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
