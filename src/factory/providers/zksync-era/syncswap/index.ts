import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import CLASSIC_POOL_ABI from '../../../../constants/abi/syncswapClassicPoolAbi.json';

const FACTORY_START_BLOCKS = {
  '0x5b9f21d407f35b10cbfddca17d5d84b129356ea3': 9776,
  '0x81251524898774F5F2FCaE7E7ae86112Cb5C317f': 26391088,
  '0x582ad7014C3f755Fc0d29eCFC02FAB4c3A2D5a3D': 35402780,
  '0xf2dad89f2788a8cd54625c60b55cd3d2d0aca7cb': 9775,
  '0x0a34FBDf37C246C0B401da5f00ABd6529d906193': 26390819,
  '0xA757eD0812092E2a8F78e6642a2A3215995A4131': 35402747,
  '0x20b28B1e4665FFf290650586ad76E977EAb90c5D': 26391325,
  '0xFfa499b019394d9bEB5e21FC54AD572E4942302b': 35333884,
  '0x0754870C1aAb00eDCFABDF4e6FEbDD30e90f327d': 35402837,
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
