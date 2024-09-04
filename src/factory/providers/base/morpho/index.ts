import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import blockchainUtil from '../../../../util/blockchainUtil';

const START_BLOCK = 13977148;
const FACTORY_ADDRESS = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';
const BLOCK_LIMIT = 10000;

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  if (block < START_BLOCK) {
    return { balances };
  }

  let cache: {
    start: number;
    tokens: string[];
  } = { start: START_BLOCK, tokens: [] };
  try {
    cache = await basicUtil.readFromCache('cache.json', chain, provider);
  } catch {}

  for (
    let i = Math.max(cache.start, START_BLOCK);
    i < block;
    i += BLOCK_LIMIT
  ) {
    const logs = await util.getLogs(
      i,
      Math.min(i + BLOCK_LIMIT - 1, block),
      '0xac4b2400f169220b0c0afdde7a0b32e775ba727ea1cb30b35f935cdaab8683ac',
      FACTORY_ADDRESS,
      web3,
    );

    logs.output.forEach((log) => {
      const firstAddress = `0x${log.data.substring(26, 66)}`;
      const secondAddress = `0x${log.data.substring(90, 130)}`;

      if (!cache.tokens.includes(firstAddress)) {
        cache.tokens.push(firstAddress);
      }
      if (!cache.tokens.includes(secondAddress)) {
        cache.tokens.push(secondAddress);
      }

      cache.start = i += BLOCK_LIMIT;
      basicUtil.saveIntoCache(cache, 'cache.json', chain, provider);
    });
  }

  const tokenBalances = await blockchainUtil.getTokenBalances(
    FACTORY_ADDRESS,
    cache.tokens,
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, tokenBalances);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
