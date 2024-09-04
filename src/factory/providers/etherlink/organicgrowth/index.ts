import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import blockchainUtil from '../../../../util/blockchainUtil';

const START_BLOCK = 308542;
const FACTORY_ADDRESS = '0x9767E409259E314F3C69fe1E7cA0D3161Bba4F5a';
const BLOCK_LIMIT = 1000;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  let cache: {
    start: number;
    pairs: object;
  } = { start: START_BLOCK, pairs: {} };
  try {
    cache = await basicUtil.readFromCache('cache.json', chain, provider);
  } catch {}

  for (
    let i = Math.max(cache.start, START_BLOCK);
    i < block;
    i += BLOCK_LIMIT
  ) {
    console.log('i', i);
    const logs = await util.getLogs(
      i,
      Math.min(i + BLOCK_LIMIT - 1, block),
      '0xa92a2b95c8d8436f6ac4c673c61487364f877efb9534d4296fad8ef904546c94',
      FACTORY_ADDRESS,
      web3,
    );

    logs.output.forEach((log) => {
      const weth = `0x${log.topics[1].substring(26, 66)}`;
      const token = `0x${log.topics[2].substring(26, 66)}`;
      const pair = `0x${log.data.substring(26, 66)}`;

      cache.start = i + BLOCK_LIMIT;
      cache.pairs[pair] = { weth, token };
      basicUtil.saveIntoCache(cache, 'cache.json', chain, provider);
    });
  }

  const tokens: string[] = [];
  const holders: string[] = [];

  for (const pair in cache.pairs) {
    if (cache.pairs.hasOwnProperty(pair)) {
      tokens.push(cache.pairs[pair].weth);
      holders.push(pair);
    }
  }

  const tokenBalances = await blockchainUtil.getTokenBalancesOfHolders(
    Object.keys(cache.pairs),
    Object.values(cache.pairs).map((pair) => pair.token),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.sumMultiBalanceOf(balances, tokenBalances); // sum second time, to get other pair token value

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
