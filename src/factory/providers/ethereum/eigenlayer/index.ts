import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { request, gql } from 'graphql-request';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';

const START_BLOCK = 17445564;
const BLOCK_LIMIT = 10000;
const SWETH = '0xf951e335afb289353dc249e82926178eac7ded78';

const EIGEN_POD_MANAGER = '0x91E677b07F7AF907ec9a428aafA9fc14a0d3A338';
const POD_DEPLOYED_TOPIC =
  '0x21c99d0db02213c32fff5b05cf0a718ab5f858802b91498f80d82270289d856a';

const SUBGRAPH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/messari/eigenlayer-ethereum';
const STRATEGY_POOLS = gql`
  query getPools($block: Int!) {
    pools(where: { type: STRATEGY }) {
      inputTokens {
        id
      }
      inputTokenBalances
    }
  }
`;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};

  let cache: {
    start: number;
    pods: { block: number; address: string }[];
  } = { start: START_BLOCK, pods: [] };
  try {
    cache = await basicUtil.readFromCache('cache.json', chain, provider);
  } catch {}
  for (
    let i = Math.max(cache.start, START_BLOCK);
    i < block;
    i += BLOCK_LIMIT
  ) {
    const logs = await util.getLogs(
      i,
      Math.min(i + BLOCK_LIMIT, block),
      POD_DEPLOYED_TOPIC,
      EIGEN_POD_MANAGER,
      web3,
    );
    logs.output.forEach((log) => {
      cache.pods.push({
        address: `0x${log.topics[1].substring(26, 66)}`,
        block: log.blockNumber,
      });
    });
  }

  cache.start = block;
  await basicUtil.saveIntoCache(cache, 'cache.json', chain, provider);

  const filteredPodsCount = cache.pods.filter(
    (pod) => pod.block <= block,
  ).length;
  balances['eth'] = BigNumber(filteredPodsCount * 38).shiftedBy(18);

  const requestResult = await request(SUBGRAPH_ENDPOINT, STRATEGY_POOLS, {
    block: block,
  });
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
