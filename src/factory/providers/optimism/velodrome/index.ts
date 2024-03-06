import uniswapV2 from '../../../../util/calculators/uniswapV2';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { gql, request } from 'graphql-request';
import BigNumber from 'bignumber.js';

const START_BLOCK = 10078686;
const FACTORY_ADDRESS = '0x25CbdDb98b35ab1FF77413456B31EC81A6B6B746';
const GRAPHQL_API = 'https://api.thegraph.com/subgraphs/name/dmihal/velodrome';
const GRAPHQL_API_V2 =
  'https://api.thegraph.com/subgraphs/name/messari/velodrome-v2-optimism';
const PAIR = gql`
  query getPairs($block: Int!) {
    liquidityPools(
      block: { number: $block }
      first: 400
      orderBy: totalValueLockedUSD
      orderDirection: desc
    ) {
      inputTokens {
        id
      }
      inputTokenBalances
    }
  }
`;

const QUERY_SIZE = 400;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }
  const [{ balances, poolBalances }, { liquidityPools }] = await Promise.all([
    uniswapV2.getTvl(FACTORY_ADDRESS, block, chain, provider, web3),
    request(GRAPHQL_API_V2, PAIR, {
      block: block,
    }),
  ]);

  const tokenBalances = [];
  liquidityPools.forEach((pair) => {
    tokenBalances.push({
      token: pair.inputTokens[0].id.toLowerCase(),
      balance: BigNumber(pair.inputTokenBalances[0]),
    });
    tokenBalances.push({
      token: pair.inputTokens[1].id.toLowerCase(),
      balance: BigNumber(pair.inputTokenBalances[1]),
    });
  });

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

async function getPoolVolumes(params) {
  const { pools, block } = params;

  const poolVolumes = await uniswapV2.getPoolVolumes(
    GRAPHQL_API,
    QUERY_SIZE,
    pools,
    block,
    null,
  );

  return poolVolumes;
}

async function getTokenVolumes(params) {
  const { tokens, block } = params;

  const tokenVolumes = await uniswapV2.getTokenVolumes(
    GRAPHQL_API,
    QUERY_SIZE,
    tokens,
    block,
    {
      volume: 'tradeVolume',
      volumeUsd: 'tradeVolumeUSD',
    },
  );

  return tokenVolumes;
}

export { tvl, getPoolVolumes, getTokenVolumes };
