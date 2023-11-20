import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 144171029;
const FACTORIES = [
  '0x1e36749E00229759dca262cB25Ad8d9B21bEB3F5',
];
const TOPIC = '0xd0e737354a56400bbcbd585fbc60373a7d31e55ad3c2543cb7d4075d2052d576';
const typesArray = [
  { type: 'address', name: 'uniswapPool' },
  { type: 'bool', name: 'quoteTokenIsToken0' },
  { type: 'address', name: 'pool' },
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
    cache = await basicUtil.readFromCache('MarginlyPools.json', chain, provider);
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
        const decodedParameters = formatter.decodeParameters(
          typesArray,
          log.data,
        );
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
  await basicUtil.saveIntoCache(cache, 'MarginlyPools.json', chain, provider);

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