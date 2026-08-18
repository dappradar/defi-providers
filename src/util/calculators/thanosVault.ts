import formatter from '../formatter';
import basicUtil from '../basicUtil';
import util from '../blockchainUtil';
import { log } from '../logger/logger';
import { IBalances } from '../../interfaces/ITvl';
import Web3 from 'web3';

/**
 * SquadSwap Thanos (v4) keeps every pool's funds in a single Vault, while pools
 * themselves are created on separate CL and Bin pool managers.
 * Tokens are collected from the Initialize events of each pool manager and their
 * balances are then read from the Vault.
 */

// Initialize(bytes32,address,address,address,uint24,bytes32,uint160,int24)
export const CL_INITIALIZE_TOPIC =
  '0x426cc62fe6a33a40ba2788c2c87a9c34ee4582b95bc9fa5a7bb7ae70b750b99c';
// Initialize(bytes32,address,address,address,uint24,bytes32,uint24)
export const BIN_INITIALIZE_TOPIC =
  '0xddfde5903015c0eb1671976c6c8f760f1328bec57f15286b6bdab2f955cab9c9';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

interface IPoolManager {
  address: string;
  topic: string;
}

async function getTvl(
  vaultAddress: string,
  poolManagers: IPoolManager[],
  startBlock: number,
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
): Promise<IBalances> {
  const balances = {};

  const cache = { block: startBlock, tokens: [] };
  try {
    cache.block = await basicUtil.readFromCache(
      `${vaultAddress}/thanosBlock.json`,
      chain,
      provider,
    );
    cache.tokens = await basicUtil.readFromCache(
      `${vaultAddress}/thanosTokens.json`,
      chain,
      provider,
    );
  } catch {}

  const tokens = cache.tokens;

  let offset = 10000;

  if (Math.max(cache.block, startBlock) < block) {
    for (let i = Math.max(cache.block, startBlock); ; ) {
      let eventLogs = [];
      try {
        const results = await Promise.all(
          poolManagers.map((poolManager) =>
            util.getLogs(
              i,
              Math.min(block, i + offset - 1),
              poolManager.topic,
              poolManager.address,
              web3,
            ),
          ),
        );
        results.forEach((result) => eventLogs.push(...result.output));
      } catch (e) {
        log.warning({
          message: e?.message || '',
          stack: e?.stack || '',
          detail: `Error: tvl of ${chain}/${provider}`,
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

      eventLogs.forEach((eventLog) => {
        const token0 = `0x${eventLog.topics[2].slice(26)}`.toLowerCase();
        const token1 = `0x${eventLog.topics[3].slice(26)}`.toLowerCase();

        if (!tokens.includes(token0)) tokens.push(token0);
        if (!tokens.includes(token1)) tokens.push(token1);
      });

      // Save into cache every 25 iterations
      if (((i - Math.max(cache.block, startBlock)) / offset) % 25 === 0) {
        await basicUtil.saveIntoCache(
          i,
          `${vaultAddress}/thanosBlock.json`,
          chain,
          provider,
        );
        await basicUtil.saveIntoCache(
          tokens,
          `${vaultAddress}/thanosTokens.json`,
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
      `${vaultAddress}/thanosBlock.json`,
      chain,
      provider,
    );
    await basicUtil.saveIntoCache(
      tokens,
      `${vaultAddress}/thanosTokens.json`,
      chain,
      provider,
    );
  }

  // The native token is stored as the zero address, its balance is added by the provider
  const tokenBalances = await util.getTokenBalances(
    vaultAddress,
    tokens.filter((token) => token !== ZERO_ADDRESS),
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
