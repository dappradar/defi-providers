import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import { log } from '../../../../util/logger/logger';
import PAIR_ABI from '../../../../constants/abi/uni.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 2100000;
const FACTORY_ADDRESS = '0x3b44b2a187a7b3824131f8db5a74194d0a42fc15';
const V3_START_BLOCK = 10292950;
const V3_FACTORY_ADDRESS = '0x40aB11c64E9fF5368F09343Ac860dAfA34e14C35';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const { balances, poolBalances } = await uniswapV2.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  let v3Pairs = { block: V3_START_BLOCK, pairs: [], token01: [] };
  try {
    v3Pairs = await basicUtil.readFromCache(
      'cache/v3Pairs.json',
      chain,
      provider,
    );
  } catch {}

  let logs = [];
  console.log('[v3] start getting tvl');
  console.log('[v3] get logs1');

  let offset = 10000;
  for (let i = Math.max(v3Pairs.block, V3_START_BLOCK); ; ) {
    console.log(`Trying from ${i} with offset ${offset}`);
    let eventLog = [];
    try {
      eventLog = (
        await util.getLogs(
          i,
          Math.min(block, i + offset),
          '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118',
          V3_FACTORY_ADDRESS,
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

  await basicUtil.saveIntoCache(
    {
      block,
      pairs: pairAddresses,
      token01: pairs,
    },
    'cache/v3Pairs.json',
    chain,
    provider,
  );

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

  return { balances, poolBalances };
}

export { tvl };
