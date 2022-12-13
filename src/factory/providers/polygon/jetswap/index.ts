import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 16569374;
const FACTORY_ADDRESS = '0x668ad0ed2622C62E24f0d5ab6B6Ac1b9D2cD4AC7';
const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/smartcookie0501/jetswap-subgraph-polygon';
const QUERY_SIZE = 400;

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

  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
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
    {
      volume: 'tradeVolume',
      volumeUsd: 'tradeVolumeUSD',
    },
  );

  return tokenVolumes;
}

export { tvl, getPoolVolumes, getTokenVolumes };
