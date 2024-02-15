import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 2539442;
const SWAP_DEPLOYER = '0xc4106bba1a8752e54940be71f7bd02c38e64f9e3';
const TOPIC =
  '0x0838512b7934222cec571cf3fde1cf3e9e864bbc431bd5d1ef4d9ed3079093d9';
const LOGS_BATCH_SIZE = 1000;
const CHUNK_SIZE = 5;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  let cache: {
    start: number;
    pools: { swapAddress: string; pooledTokens: string[] }[];
  } = {
    start: START_BLOCK,
    pools: [],
  };
  try {
    cache = await basicUtil.readFromCache('cache/cache.json', chain, provider);
  } catch {}

  const typesArray = [
    { type: 'address', name: 'swapAddress' },
    { type: 'address[]', name: 'pooledTokens' },
  ];

  if (cache.start < block) {
    try {
      const decodedLogsParameters = await util.getDecodedLogsParameters(
        cache.start,
        block,
        TOPIC,
        SWAP_DEPLOYER,
        undefined,
        typesArray,
        web3,
        LOGS_BATCH_SIZE,
        CHUNK_SIZE,
      );
      decodedLogsParameters.forEach((decodedLogParameters) => {
        cache.pools.push({
          swapAddress: decodedLogParameters.swapAddress,
          pooledTokens: decodedLogParameters.pooledTokens,
        });
      });
      cache.start = block + 1;
      await basicUtil.saveIntoCache(cache, 'cache/cache.json', chain, provider);
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: tvl of cronos/ferro. New logs are not scanned`,
        endpoint: 'tvl',
      });
    }
  }

  for (const pool of cache.pools) {
    const tokenBalances = await util.getTokenBalances(
      pool.swapAddress,
      pool.pooledTokens,
      block,
      chain,
      web3,
    );
    formatter.sumMultiBalanceOf(balances, tokenBalances);
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
