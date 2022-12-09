/*==================================================
  Modules
  ==================================================*/

const util = require("../../sdk/util");
const uniswapV2 = require("../../sdk/helpers/uniswapV2");
const GRAPHQL_API =
  "https://api.thegraph.com/subgraphs/name/traderjoe-xyz/exchange";
const QUERY_SIZE = 400;

/*==================================================
  Settings
  ==================================================*/

const START_BLOCK = 2486392;
const FACTORY_ADDRESS = "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10";

/*==================================================
  TVL
  ==================================================*/

async function tvl(block) {
  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block
  );

  util.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}

async function getPoolVolumes(pools, priorBlockNumber) {
  const poolVolumes = await uniswapV2.getPoolVolumes(
    GRAPHQL_API,
    QUERY_SIZE,
    pools,
    priorBlockNumber
  );

  return poolVolumes;
}

async function getTokenVolumes(tokens, priorBlockNumber) {
  const tokenVolumes = await uniswapV2.getTokenVolumes(
    GRAPHQL_API,
    QUERY_SIZE,
    tokens,
    priorBlockNumber
  );

  return tokenVolumes;
}

/*==================================================
  Exports
  ==================================================*/

module.exports = {
  tvl,
  getPoolVolumes,
  getTokenVolumes,
};
