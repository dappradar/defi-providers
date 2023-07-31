import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import CLASSIC_POOL_ABI from './classicPoolAbi.json';

const START_BLOCK = 9775;
const FACTORIES = [
  '0xf2dad89f2788a8cd54625c60b55cd3d2d0aca7cb',
  '0x5b9f21d407f35b10cbfddca17d5d84b129356ea3',
];
const TOPIC =
  '0x9c5d829b9b23efc461f9aeef91979ec04bb903feb3bee4f26d22114abfc7335b';
const BLOCK_LIMIT = 10000;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  let cache: {
    start: number;
    pools: object;
  } = { start: START_BLOCK, pools: {} };
  try {
    cache = await basicUtil.readFromCache('cache.json', chain, provider);
  } catch {}

  for (const factory of FACTORIES) {
    for (
      let i = Math.max(cache.start, START_BLOCK);
      i < block;
      i += BLOCK_LIMIT
    ) {
      const logs = await util.getLogs(
        i,
        Math.min(i + BLOCK_LIMIT, block),
        TOPIC,
        factory,
        web3,
      );

      logs.output.forEach((log) => {
        const token0 = `0x${log.topics[1].substring(26, 66)}`;
        const token1 = `0x${log.topics[2].substring(26, 66)}`;
        const pool = `0x${log.data.substring(26, 66)}`;

        cache.pools[pool] = { token0, token1 };
      });
    }
  }

  cache.start = block;
  await basicUtil.saveIntoCache(cache, 'cache.json', chain, provider);

  const reserves = await util.executeCallOfMultiTargets(
    Object.keys(cache.pools),
    CLASSIC_POOL_ABI,
    'getReserves',
    [],
    block,
    chain,
    web3,
  );

  Object.entries(cache.pools).forEach(([, pool], index) => {
    if (BigNumber(reserves[index]._reserve0).isGreaterThan(0)) {
      balances[pool.token0] = BigNumber(balances[pool.token0] || 0).plus(
        reserves[index]._reserve0,
      );
    }
    if (BigNumber(reserves[index]._reserve1).isGreaterThan(0)) {
      balances[pool.token1] = BigNumber(balances[pool.token1] || 0).plus(
        reserves[index]._reserve1,
      );
    }
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
