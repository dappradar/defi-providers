import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const POOL_FACTORY = '0xde204e5a060ba5d3b63c7a4099712959114c2d48';
const START_BLOCK = 14443222;

const STAKING_CONTRACT = '0x629E39da1Db5654fe59cAE31d48CAEBB8dC2A9c6';

const CLEARPOOL = '0x66761fa41377003622aee3c7675fc7b5c1c2fac5';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};
  let poolsAndTokens = { start: START_BLOCK, tokens: [], pools: [] };
  try {
    poolsAndTokens = await basicUtil.readFromCache(
      'cache/pools.json',
      chain,
      provider,
    );
  } catch {}

  const logs = await util.getLogs(
    Math.max(START_BLOCK, poolsAndTokens.start),
    block,
    '0x9c5d829b9b23efc461f9aeef91979ec04bb903feb3bee4f26d22114abfc7335b',
    POOL_FACTORY,
    web3,
  );

  logs.output.forEach((log) => {
    const token = `0x${log.topics[3].substring(26, 66)}`;
    const pool = `0x${log.topics[1].substring(26, 66)}`;
    if (!poolsAndTokens.tokens.includes(token)) {
      poolsAndTokens.tokens.push(token);
    }
    if (!poolsAndTokens.pools.includes(pool)) {
      poolsAndTokens.pools.push(pool);
    }
  });

  const tokenBalances = await util.getTokenBalancesOfHolders(
    [...poolsAndTokens.pools, STAKING_CONTRACT],
    [...poolsAndTokens.tokens, CLEARPOOL],
    block,
    chain,
    web3,
  );

  basicUtil.savedIntoCache(
    {
      start: block,
      tokens: poolsAndTokens.tokens,
      pools: poolsAndTokens.pools,
    },
    'cache/pools.json',
    chain,
    provider,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
