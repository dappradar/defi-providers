import formatter from '../../util/formatter';
import basicUtil from '../../util/basicUtil';
import util from '../../util/blockchainUtil';
import { log } from '../../util/logger/logger';
import { IBalances } from '../../interfaces/ITvl';
import Web3 from 'web3';

const UNISWAP_TOPIC =
  '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118';
const ALGEBRA_TOPIC =
  '0x91ccaa7a278130b65168c3a0c8d3bcae84cf5e43704342bd3ec0b59e59c036db';

/**
 * Gets TVL of Uniswap V3 (or its clone) using factory address
 *
 * @param factoryAddress - The address of factory
 * @param startBlock - The block number of factory deploying transaction
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param provider - the provider folder name
 * @param web3 - The Web3 object
 * @param algebra - true if algebra methods are used
 * @returns The object containing object with token addresses and their locked values and object with pool balances
 *
 */
async function getTvl(
  factoryAddress: string,
  startBlock: number,
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
  isAlgebra = false,
): Promise<IBalances> {
  const balances = {};

  let topic: string;
  if (isAlgebra) {
    topic = ALGEBRA_TOPIC;
  } else {
    topic = UNISWAP_TOPIC;
  }

  const v3Pairs = { block: startBlock, pairs: [], token0: [], token1: [] };
  try {
    v3Pairs.block = await basicUtil.readFromCache(
      'cache/uniswapV3Block.json',
      chain,
      provider,
    );
    v3Pairs.pairs = await basicUtil.readFromCache(
      'cache/uniswapV3Pairs.json',
      chain,
      provider,
    );
    v3Pairs.token0 = await basicUtil.readFromCache(
      'cache/uniswapV3Token0.json',
      chain,
      provider,
    );
    v3Pairs.token1 = await basicUtil.readFromCache(
      'cache/uniswapV3Token1.json',
      chain,
      provider,
    );
  } catch {}

  const token0 = v3Pairs.token0;
  const token1 = v3Pairs.token1;
  const pairs = v3Pairs.pairs;
  const start = 128 - 40 + 2;
  const end = 128 + 2;

  console.log('[v3] start getting tvl');

  let offset = 10000;

  if (Math.max(v3Pairs.block, startBlock) < block) {
    for (let i = Math.max(v3Pairs.block, startBlock); ; ) {
      console.log(`Trying from ${i} with offset ${offset}`);
      let eventLog = [];
      try {
        eventLog = (
          await util.getLogs(
            i,
            Math.min(block, i + offset - 1),
            topic,
            factoryAddress,
            web3,
          )
        ).output;
      } catch (e) {
        log.warning({
          message: e?.message || '',
          stack: e?.stack || '',
          detail: `Error: tvl of ethereum/uniswapv3`,
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
        let pairAddress: string;
        if (isAlgebra) {
          pairAddress = `0x${log.data.slice(-40)}`;
        } else {
          pairAddress = `0x${log.data.slice(start, end)}`;
        }
        pairAddress = pairAddress.toLowerCase();

        pairs.push(pairAddress);
        token0.push(`0x${log.topics[1].slice(26)}`);
        token1.push(`0x${log.topics[2].slice(26)}`);
      });

      // Save into cache every 25 iterations
      if (((i - Math.max(v3Pairs.block, startBlock)) / offset) % 25 === 0) {
        basicUtil.saveIntoCache(
          i,
          'cache/uniswapV3Block.json',
          chain,
          provider,
        );
        basicUtil.saveIntoCache(
          pairs,
          'cache/uniswapV3Pairs.json',
          chain,
          provider,
        );
        basicUtil.saveIntoCache(
          token0,
          'cache/uniswapV3Token0.json',
          chain,
          provider,
        );
        basicUtil.saveIntoCache(
          token1,
          'cache/uniswapV3Token1.json',
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
    basicUtil.saveIntoCache(
      block,
      'cache/uniswapV3Block.json',
      chain,
      provider,
    );
    basicUtil.saveIntoCache(
      pairs,
      'cache/uniswapV3Pairs.json',
      chain,
      provider,
    );
    basicUtil.saveIntoCache(
      token0,
      'cache/uniswapV3Token0.json',
      chain,
      provider,
    );
    basicUtil.saveIntoCache(
      token1,
      'cache/uniswapV3Token1.json',
      chain,
      provider,
    );
  }

  const token0Balances = await util.getTokenBalancesOfHolders(
    pairs,
    token0,
    block,
    chain,
    web3,
  );
  const token1Balances = await util.getTokenBalancesOfHolders(
    pairs,
    token1,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, token1Balances);
  formatter.sumMultiBalanceOf(balances, token0Balances);
  formatter.convertBalancesToFixed(balances);

  return balances;
}

export default {
  getTvl,
};
