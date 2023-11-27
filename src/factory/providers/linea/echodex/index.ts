import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import { log } from '../../../../util/logger/logger';
import PAIR_ABI from '../../../../constants/abi/uni.json';

const START_BLOCK = 120029;
const UNIV2 = '0x6D1063F2187442Cc9adbFAD2f55A96B846FCB399';
const UNIV3_ECHODEX3 = '0x559Fa53Be355835a038aC303A750E8788668636B';
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }
  const { balances, poolBalances } = await uniswapV2.getTvl(
    UNIV2,
    block,
    chain,
    provider,
    web3,
  );
  const { balances: univ3Balance } = await echodexv3(params);
  formatter.sumMultiBalanceOf(balances, univ3Balance);
  //formatter.convertBalancesToFixed(balances);
  return { balances };
}

async function echodexv3(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  let v3Pairs = { block: START_BLOCK, pairs: [], token01: [] };
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
  for (let i = Math.max(v3Pairs.block, START_BLOCK); ; ) {
    console.log(`Trying from ${i} with offset ${offset}`);
    let eventLog = [];
    try {
      eventLog = (
        await util.getLogs(
          i,
          Math.min(block, i + offset),
          '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118',
          UNIV3_ECHODEX3,
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
        let pairAddress = `0x${log.data.slice(start, end)}`;
        pairAddress = pairAddress.toLowerCase();

        pairs[pairAddress] = {
          token0Address: `0x${log.topics[1].slice(26)}`,
          token1Address: `0x${log.topics[2].slice(26)}`,
        };

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

  return { balances };
}

export { tvl };
