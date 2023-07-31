import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 1337265;
const FACTORIES = [
  '0x96707414db71e553f6a49c7adc376e40f3befc33',
  '0x2c1a605f843a2e18b7d7772f0ce23c236accf7f5',
];
const TOPIC =
  '0x9b3fb3a17b4e94eb4d1217257372dcc712218fcd4bc1c28482bd8a6804a7c775';
const typesArray = [
  { type: 'address', name: 'poolAddress' },
  { type: 'uint256', name: 'fee' },
  { type: 'uint256', name: 'tickSpacing' },
  { type: 'int32', name: 'activeTick' },
  { type: 'int256', name: 'lookback' },
  { type: 'uint64', name: 'protocolFeeRatio' },
  { type: 'address', name: 'tokenA' },
  { type: 'address', name: 'tokenB' },
];

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
    const logs = await util.getLogs(
      Math.max(START_BLOCK, cache.start),
      block,
      TOPIC,
      factory,
      web3,
    );

    logs.output.forEach((log) => {
      const decodedParameters = formatter.decodeParameters(
        typesArray,
        log.data,
      );

      cache.pools[decodedParameters.poolAddress] = [
        decodedParameters.tokenA,
        decodedParameters.tokenB,
      ];
    });
  }

  cache.start = block;
  await basicUtil.saveIntoCache(cache, 'cache.json', chain, provider);

  const tokenBalances = await util.getTokenBalancesOfHolders(
    Object.keys(cache.pools).flatMap((i) => [i, i]),
    Object.keys(cache.pools)
      .map((tokens) => cache.pools[tokens])
      .flat(1),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
