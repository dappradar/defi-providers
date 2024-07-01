import formatter from '../../util/formatter';
import basicUtil from '../../util/basicUtil';
import util from '../../util/blockchainUtil';
import { log } from '../../util/logger/logger';
import PAIR_ABI from '../../constants/abi/uni.json';
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

  let v3Pairs = { block: startBlock, pairs: [], token01: [] };
  try {
    v3Pairs = await basicUtil.readFromCache(
      'cache/v3Pairs.json',
      chain,
      provider,
    );
  } catch {}

  const pairs = v3Pairs.token01;
  const pairAddresses = v3Pairs.pairs;
  const start = 128 - 40 + 2;
  const end = 128 + 2;

  const pairExist = {};
  pairAddresses.forEach((address) => (pairExist[address] = true));

  console.log('[v3] start getting tvl');
  console.log('[v3] get logs1');

  let offset = 10000;
  for (let i = Math.max(v3Pairs.block, startBlock); ; ) {
    console.log(`Trying from ${i} with offset ${offset}`);
    let eventLog = [];
    try {
      eventLog = (
        await util.getLogs(
          i,
          Math.min(block, i + offset),
          topic,
          factoryAddress,
          web3,
        )
      ).output;
      console.log(`Trying from ${i} with offset ${offset}`);
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: tvl of ethereum/uniswapv3`,
        endpoint: 'tvl',
      });
      if (offset > 3000) {
        offset -= 2000;
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

      pairs[pairAddress] = {
        token0Address: `0x${log.topics[1].slice(26)}`,
        token1Address: `0x${log.topics[2].slice(26)}`,
      };

      if (!pairExist[pairAddress]) {
        pairExist[pairAddress] = true;
        pairAddresses.push(pairAddress);
      }

      basicUtil.saveIntoCache(
        {
          block,
          pairs: pairAddresses,
          token01: pairs,
        },
        'cache/v3Pairs.json',
        chain,
        provider,
      );
    });

    i += offset;
    if (block < i) {
      break;
    }
  }

  const tokens0 = await util.executeCallOfMultiTargets(
    pairAddresses,
    PAIR_ABI,
    'token0',
    [],
    block,
    chain,
    web3,
  );
  const tokens1 = await util.executeCallOfMultiTargets(
    pairAddresses,
    PAIR_ABI,
    'token1',
    [],
    block,
    chain,
    web3,
  );

  const token0Balances = await util.getTokenBalancesOfHolders(
    pairAddresses,
    tokens0.filter(Boolean),
    block,
    chain,
    web3,
  );

  const token1Balances = await util.getTokenBalancesOfHolders(
    pairAddresses,
    tokens1.filter(Boolean),
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
