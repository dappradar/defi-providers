import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 144171029;
const TOPICV1 =
  '0xd0e737354a56400bbcbd585fbc60373a7d31e55ad3c2543cb7d4075d2052d576';
const TOPICV15 =
  '0x711e3e5dab53990b08943dd1648a41413712f35934fc7775b3dc56345de0919d';

const FACTORIES = [
  {
    factory: '0x1e36749E00229759dca262cB25Ad8d9B21bEB3F5',
    topic: TOPICV1,
    types: [
      { type: 'address', name: 'uniswapPool' },
      { type: 'bool', name: 'quoteTokenIsToken0' },
      { type: 'address', name: 'pool' },
    ],
  },
  {
    factory: '0x537A3417Fe03e28F4E9640Bece70887a6938ff92',
    topic: TOPICV15,
    types: [
      { type: 'uint32', name: 'defaultSwapCallData' },
      { type: 'address', name: 'pool' },
    ],
  },
];

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
    cache = await basicUtil.readFromCache('pools.json', chain, provider);
  } catch {}

  for (const { factory, topic, types } of FACTORIES) {
    for (
      let i = Math.max(cache.start, START_BLOCK);
      i < block;
      i += BLOCK_LIMIT
    ) {
      const logs = await util.getLogs(
        i,
        Math.min(i + BLOCK_LIMIT, block),
        topic,
        factory,
        web3,
      );
      logs.output.forEach((log) => {
        const decodedParameters = formatter.decodeParameters(types, log.data);
        const marginlyPool = decodedParameters.pool;
        console.log(`New Marginly pool: ${marginlyPool}`);
        const quoteToken = `0x${log.topics[1].slice(26)}`;
        console.log(`  quote token: ${quoteToken}`);
        const baseToken = `0x${log.topics[2].slice(26)}`;
        console.log(`  base token: ${baseToken}`);
        cache.pools[marginlyPool] = [quoteToken, baseToken];
      });
    }
  }

  cache.start = block;
  await basicUtil.saveIntoCache(cache, 'pools.json', chain, provider);

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
