import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { trident } from './trident';
import BigNumber from 'bignumber.js';
import { gql, request } from 'graphql-request';
import formatter from '../../../../util/formatter';

const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/sushi-labs/kashi-arbitrum';
const GRAPHQL_API_FACTORY =
  'https://api.thegraph.com/subgraphs/name/sushi-v2/sushiswap-arbitrum';
const QUERY_SIZE = 500;
const PAIR = gql`
  query getPairs($block: Int!) {
    pairs(
      block: { number: $block }
      orderBy: liquidityUSD
      orderDirection: desc
      first: ${QUERY_SIZE}
    ) {
      token0 {
        id
      }
      token1 {
        id
      }
      reserve0
      reserve1
    }
  }
`;
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const requestResult = await request(GRAPHQL_API_FACTORY, PAIR, {
    block: block,
  });
  const dexBalances = {};
  requestResult.pairs.forEach((pair) => {
    if (dexBalances[pair.token0.id]) {
      dexBalances[pair.token0.id] = BigNumber(pair.reserve0)
        .plus(dexBalances[pair.token0.id])
        .toFixed();
    } else {
      dexBalances[pair.token0.id] = BigNumber(pair.reserve0).toFixed();
    }
    if (dexBalances[pair.token1.id]) {
      dexBalances[pair.token1.id] = BigNumber(pair.reserve1)
        .plus(dexBalances[pair.token1.id])
        .toFixed();
    } else {
      dexBalances[pair.token1.id] = BigNumber(pair.reserve1).toFixed();
    }
  });

  const { balances: tridentBalance } = await trident(params);

  const balances = formatter.sum([dexBalances, tridentBalance]);

  for (const token in balances) {
    if (BigNumber(balances[token] || 0).isLessThan(100000)) {
      delete balances[token];
    }
  }
  // const { balances: kashib } = await kashi(params);
  return { balances };
}

async function getPoolVolumes(pools, priorBlockNumber) {
  const poolVolumes = await uniswapV2.getPoolVolumes(
    GRAPHQL_API,
    QUERY_SIZE,
    pools,
    priorBlockNumber,
    null,
  );

  return poolVolumes;
}

async function getTokenVolumes(tokens, priorBlockNumber) {
  const tokenVolumes = await uniswapV2.getTokenVolumes(
    GRAPHQL_API,
    QUERY_SIZE,
    tokens,
    priorBlockNumber,
    null,
  );

  return tokenVolumes;
}

export { tvl, getPoolVolumes, getTokenVolumes };
