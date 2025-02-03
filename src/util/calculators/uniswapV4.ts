import formatter from '../formatter';
import basicUtil from '../basicUtil';
import util from '../blockchainUtil';
import { log } from '../logger/logger';
import { IBalances } from '../../interfaces/ITvl';
import Web3 from 'web3';

const UNISWAP_TOPIC =
  '0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438';

async function getTvl(
  poolManagerAddress: string,
  startBlock: number,
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
): Promise<IBalances> {
  const balances = {};

  const v4Tokens = { block: startBlock, tokens: [] };
  try {
    v4Tokens.block = await basicUtil.readFromCache(
      `${poolManagerAddress}/uniswapV4Block.json`,
      chain,
      provider,
    );
    v4Tokens.tokens = await basicUtil.readFromCache(
      `${poolManagerAddress}/uniswapV4Tokens.json`,
      chain,
      provider,
    );
  } catch {}
  console.log(v4Tokens);

  const tokens = v4Tokens.tokens;
  const start = 128 - 40 + 2;
  const end = 128 + 2;

  console.log('[v4] start getting tvl');

  let offset = 10000;

  if (Math.max(v4Tokens.block, startBlock) < block) {
    for (let i = Math.max(v4Tokens.block, startBlock); ; ) {
      console.log(`Trying from ${i} with offset ${offset}`);
      let eventLog = [];
      try {
        eventLog = (
          await util.getLogs(
            i,
            Math.min(block, i + offset - 1),
            UNISWAP_TOPIC,
            poolManagerAddress,
            web3,
          )
        ).output;
      } catch (e) {
        log.warning({
          message: e?.message || '',
          stack: e?.stack || '',
          detail: `Error: tvl of ethereum/uniswapv4`,
          endpoint: 'tvl',
        });
        if (offset >= 2000) {
          offset -= 1000;
        } else if (offset > 300) {
          offset -= 200;
        } else if (offset > 30) {
          offset -= 20;
        } else {
          break;
        }
        continue;
      }

      eventLog.forEach((log) => {
        const token1 = `0x${log.topics[2].slice(26)}`.toLowerCase();
        const token2 = `0x${log.topics[3].slice(26)}`.toLowerCase();

        if (!tokens.includes(token1)) tokens.push(token1);
        if (!tokens.includes(token2)) tokens.push(token2);
      });

      // Save into cache every 25 iterations
      if (((i - Math.max(v4Tokens.block, startBlock)) / offset) % 25 === 0) {
        console.log('save');
        await basicUtil.saveIntoCache(
          i,
          `${poolManagerAddress}/uniswapV4Block.json`,
          chain,
          provider,
        );
        await basicUtil.saveIntoCache(
          tokens,
          `${poolManagerAddress}/uniswapV4Tokens.json`,
          chain,
          provider,
        );
      }

      i += offset;
      if (block < i) {
        break;
      }
    }

    // Save into cache on the last iteration
    await basicUtil.saveIntoCache(
      block,
      `${poolManagerAddress}/uniswapV4Block.json`,
      chain,
      provider,
    );
    await basicUtil.saveIntoCache(
      tokens,
      `${poolManagerAddress}/uniswapV4Tokens.json`,
      chain,
      provider,
    );
  }

  const tokenBalances = await util.getTokenBalances(
    poolManagerAddress,
    tokens,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  return balances;
}

export default {
  getTvl,
};
