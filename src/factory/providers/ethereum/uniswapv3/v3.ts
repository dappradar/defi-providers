import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import util from '../../../../util/blockchainUtil';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const START_BLOCK = 12369621;
const FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const SUBGRAPH_ENDPOINT =
  'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
const GET_RESERVES = `
    query GET_RESERVES($startPool: String, $block: Int) {
        pools (first: 1000, orderBy: id, where: {id_gt: $startPool}, block: {number: $block}) {
            id
            token0 {
                id
                decimals
            }
            token1 {
                id
                decimals
            }
            totalValueLockedToken0
            totalValueLockedToken1
        }
    }
`;

async function getReserves(startPool, block) {
  const balances = [];
  try {
    console.log(`[v3] Getting Pair Info from ${startPool}`);
    const result = await fetch(SUBGRAPH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_RESERVES,
        variables: {
          startPool,
          block,
        },
      }),
    })
      .then((res) => res.json())
      .then((res) => res.data.pools);
    result.forEach((pool) => {
      try {
        balances.push({
          token: pool.token0.id.toLowerCase(),
          balance: new BigNumber(pool.totalValueLockedToken0).times(
            10 ** pool.token0.decimals,
          ),
        });
        balances.push({
          token: pool.token1.id.toLowerCase(),
          balance: new BigNumber(pool.totalValueLockedToken1).times(
            10 ** pool.token1.decimals,
          ),
        });
      } catch (e) {
        log.error({
          message: e?.message || '',
          stack: e?.stack || '',
          detail: `Error: getReserves of ethereum/uniswapv3`,
          endpoint: 'getReserves',
        });
      }
    });
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `[v3] Issue with SubGraph on from ${startPool}`,
      endpoint: 'getReserves',
    });
  }

  return balances;
}

export async function tvl(block, chain, provider, web3) {
  if (block < START_BLOCK) {
    return {};
  }

  let v3Pairs = { block: START_BLOCK, pairs: [], token01: [] };
  try {
    v3Pairs = await basicUtil.readDataFromFile(
      'cache/v3Pairs.json',
      chain,
      provider,
    );
  } catch {}

  let logs = [];
  console.log('[v3] start getting tvl');
  console.log('[v3] get logs1');

  let offset = 10000;
  for (let i = Math.max(v3Pairs.block, START_BLOCK); ; ) {
    console.log(`Trying from ${i} with offset ${offset}`);
    let eventLog = [];
    try {
      eventLog = (
        await util.getLogs(
          i,
          Math.min(block, i + offset),
          '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118',
          FACTORY,
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
      if (offset > 1000) {
        offset -= 2000;
      } else if (offset > 100) {
        offset -= 200;
      } else if (offset > 10) {
        offset -= 20;
      } else {
        break;
      }
      continue;
    }
    logs = logs.concat(eventLog);

    i += offset;
    if (block < i) {
      break;
    }
  }

  const pairs = v3Pairs.token01;
  let pairAddresses = v3Pairs.pairs;
  const start = 128 - 40 + 2;
  const end = 128 + 2;

  const pairExist = {};
  pairAddresses.forEach((address) => (pairExist[address] = true));

  pairAddresses = pairAddresses.concat(
    // sometimes the full log is emitted
    logs
      .map((log) => {
        let pairAddress =
          typeof log === 'string' ? log : `0x${log.data.slice(start, end)}`;
        pairAddress = pairAddress.toLowerCase();
        if (typeof log !== 'string') {
          pairs[pairAddress] = {
            token0Address: `0x${log.topics[1].slice(26)}`,
            token1Address: `0x${log.topics[2].slice(26)}`,
          };
        }
        return pairAddress;
      })
      .filter((address) => !pairExist[address]),
  );

  basicUtil.writeDataToFile(
    {
      block,
      pairs: pairAddresses,
      token01: pairs,
    },
    'cache/v3Pairs.json',
    chain,
    provider,
  );

  const pairLength = pairAddresses.length;
  const balanceCalls = [];
  const sortedPair = pairAddresses.sort((a, b) => (a > b ? 1 : -1));

  for (let i = 0; i < pairLength; i += 1000) {
    balanceCalls.push(getReserves(sortedPair[i], block - 10));
  }
  const balanceResults = await Promise.all(balanceCalls);
  const balances = {};
  balanceResults.forEach((result) => {
    formatter.sumMultiBalanceOf(balances, result);
  });
  return balances;
}
