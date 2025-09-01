import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import CLASSIC_POOL_ABI from '../../../../constants/abi/syncswapClassicPoolAbi.json';

const FACTORY_START_BLOCKS = {
  '0xE4CF807E351b56720B17A59094179e7Ed9dD3727': 716,
  '0x61Abf754fc031C544236053495a193f3518e9101': 4515689,
  '0x024A096bAb43587d24004C95C3e20FcB7518Ad86': 4959040,
  '0x37BAc764494c8db4e54BDE72f6965beA9fa0AC2d': 716,
  '0x9573994Ae6C9b35627976d26FA89e507e71FBaA2': 4515687,
  '0xb8AbaEa25E42DA5ac6897C9DAb0a8157885fE32b': 4959039,
  '0x7a31060d8524c21496a352BE65549eEf1e864fb0': 4515693,
  '0x1080EE857D165186aF7F8d63e8ec510C28A6d1Ea': 4959043,
};
const FACTORIES = Object.keys(FACTORY_START_BLOCKS);
const START_BLOCK = Math.min(...Object.values(FACTORY_START_BLOCKS));
const TOPIC =
  '0x9c5d829b9b23efc461f9aeef91979ec04bb903feb3bee4f26d22114abfc7335b';
const BLOCK_LIMIT = 10000;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  const allPools = {};

  for (const factory of FACTORIES) {
    const factoryStartBlock = FACTORY_START_BLOCKS[factory];
    let factoryCache = { start: factoryStartBlock, pools: {} };

    try {
      factoryCache = await basicUtil.readFromCache(
        `${factory}/cache.json`,
        chain,
        provider,
      );
    } catch {}

    let iterationCount = 0;

    for (
      let i = Math.max(factoryCache.start, factoryStartBlock);
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

        factoryCache.pools[pool] = { token0, token1 };
      });

      iterationCount++;

      if (iterationCount % 25 === 0) {
        factoryCache.start = i + BLOCK_LIMIT;
        await basicUtil.saveIntoCache(
          factoryCache,
          `${factory}/cache.json`,
          chain,
          provider,
        );
      }
    }

    factoryCache.start = block;
    await basicUtil.saveIntoCache(
      factoryCache,
      `${factory}/cache.json`,
      chain,
      provider,
    );

    Object.assign(allPools, factoryCache.pools);
  }

  const reserves = await util.executeCallOfMultiTargets(
    Object.keys(allPools),
    CLASSIC_POOL_ABI,
    'getReserves',
    [],
    block,
    chain,
    web3,
  );

  Object.entries(allPools).forEach(([, pool], index) => {
    const poolData = pool as { token0: string; token1: string };
    if (BigNumber(reserves[index]._reserve0).isGreaterThan(0)) {
      balances[poolData.token0] = BigNumber(
        balances[poolData.token0] || 0,
      ).plus(reserves[index]._reserve0);
    }
    if (BigNumber(reserves[index]._reserve1).isGreaterThan(0)) {
      balances[poolData.token1] = BigNumber(
        balances[poolData.token1] || 0,
      ).plus(reserves[index]._reserve1);
    }
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
