import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const START_BLOCK = 597724;
const FACTORY_ADDRESS = '0x017603C8f29F7f6394737628a93c57ffBA1b7256';
const TOKEN_CONVERT = {
  //USDC.m
  '0x748134b5f553f2bcbd78c6826de99a70274bdeb3':
    '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d',
  //BTC.m
  '0x78f811a431d248c1edcf6d95ec8551879b2897c3':
    '0x6ab6d61428fde76768d7b45d8bfeec19c6ef91a8',
  //USDT.m
  '0xe936caa7f6d9f5c9e907111fcaf7c351c184cda7':
    '0xb44a9b6905af7c801311e8f4e76932ee959c663c',
  //ETH.m
  '0x576fde3f61b7c97e381c94e7a03dbc2e08af1111':
    '0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c',
};
const GRAPHQL_API =
  'https://api.thegraph.com/subgraphs/name/lansehuiyi6/huckleberry-subgraph';
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

  for (const token in TOKEN_CONVERT) {
    if (balances[token]) {
      balances[TOKEN_CONVERT[token]] = BigNumber(
        balances[TOKEN_CONVERT[token]] || 0,
      )
        .plus(balances[token])
        .toFixed();
      delete balances[token];
    }
  }

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
