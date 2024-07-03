import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { trident } from './trident';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';

const FACTORY_ADDRESS = '0xc35DADB65012eC5796536bD9864eD8773aBc74C4';
const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/sushi-labs/kashi-arbitrum';
const QUERY_SIZE = 500;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const { balances: dexBalances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  //const { balances: tridentBalance } = await trident(params);

  const balances = formatter.sum([dexBalances /*, tridentBalance*/]);

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

export { tvl, getPoolVolumes, getTokenVolumes };
