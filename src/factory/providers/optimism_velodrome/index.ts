/*==================================================
  Modules
  ==================================================*/

import util from '../../sdk/util';
import uniswapV2 from '../../sdk/helpers/uniswapV2';

/*==================================================
    Settings
    ==================================================*/

const START_BLOCK = 10078686;
const FACTORY_ADDRESS = '0x25CbdDb98b35ab1FF77413456B31EC81A6B6B746';
const GRAPHQL_API = 'https://api.thegraph.com/subgraphs/name/dmihal/velodrome';
const QUERY_SIZE = 400;

/*==================================================
    TVL
    ==================================================*/

async function tvl(params) {
  const { block, chain, provider } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
  );

  util.convertBalancesToFixed(balances);

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

/*==================================================
    Exports
    ==================================================*/

export { tvl, getPoolVolumes, getTokenVolumes };
