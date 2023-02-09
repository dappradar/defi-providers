import { kashiLending } from './kashi-lending';
import BigNumber from 'bignumber.js';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const START_BLOCK = 10794229;
const FACTORY_ADDRESS = '0xc0aee478e3658e2610c5f7a4a2e1777ce9e4f2ac';
const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/sushiswap/exchange';
const QUERY_SIZE = 400;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const { balances: dexBalances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  const kashiBalances = await kashiLending({
    block,
    chain,
    provider,
    web3,
  } as ITvlParams);

  const balances = formatter.sum([dexBalances, kashiBalances.balances]);

  for (const token in balances) {
    if (BigNumber(balances[token] || 0).isLessThan(100000)) {
      delete balances[token];
    }
  }

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
    null,
  );

  return tokenVolumes;
}

module.exports = {
  tvl,
  getPoolVolumes,
  getTokenVolumes,
};
