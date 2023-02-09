import BigNumber from 'bignumber.js';
import SINGLE_POOL_FACTORY_ABI from './abi/singlePoolFactory.json';
import SINGLE_POOL_ABI from './abi/singlePool.json';
import formatter from '../../../../util/formatter';
import uniswapV2 from '../../../../util/calculators/uniswapV2';
import util from '../../../../util/blockchainUtil';
import { web3 } from '@project-serum/anchor';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 27827673;
const FACTORY_ADDRESS = '0x9f3044f7f9fc8bc9ed615d54845b4577b833282d';
const SINGLE_POOL_FACTORY_ADDRESS =
  '0x504722a6eabb3d1573bada9abd585ae177d52e7a';
const VOTING_PROTOCOL_ADDRESS = '0x176b29289f66236c65c7ac5db2400abb5955df13';
const MESHSWAP_TOKEN_ADDRESS = '0x82362ec182db3cf7829014bc61e9be8a2e82868a';

async function getSinglePoolBalances(block, chain, provider, web3) {
  let pools = {};
  try {
    pools = basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch {}

  const poolCount = await util.executeCall(
    SINGLE_POOL_FACTORY_ADDRESS,
    SINGLE_POOL_FACTORY_ABI,
    'getPoolCount',
    [],
    block,
    chain,
    web3,
  );

  const newPoolIndexes = [];
  for (let i = 0; i < poolCount; i++) {
    if (!pools[i]) {
      newPoolIndexes.push(i);
    }
  }

  const newPools = await util.executeMultiCallsOfTarget(
    SINGLE_POOL_FACTORY_ADDRESS,
    SINGLE_POOL_FACTORY_ABI,
    'getPoolAddressByIndex',
    newPoolIndexes,
    block,
    chain,
    web3,
  );

  newPools.forEach((pool, index) => {
    pools[index] = pool;
  });

  if (newPools.length > 0) {
    await basicUtil.writeDataToFile(pools, 'pools.json', chain, provider);
  }

  const tokens = await util.executeCallOfMultiTargets(
    Object.values(pools),
    SINGLE_POOL_ABI,
    'token',
    [],
    block,
    chain,
    web3,
  );
  const cash = await util.executeCallOfMultiTargets(
    Object.values(pools),
    SINGLE_POOL_ABI,
    'getCash',
    [],
    block,
    chain,
    web3,
  );

  const balances = {};
  const poolBalances = {};
  for (let i = 0; i < poolCount; i++) {
    balances[tokens[i].toLowerCase()] = cash[i];
    poolBalances[pools[i]] = {
      tokens: [tokens[i].toLowerCase()],
      balances: [cash[i]],
    };
  }

  return { balances, poolBalances };
}

function convertOrbitBalances(balances) {
  const mapping = {
    '0x12c9ffe6538f20a982fd4d17912f0ca00fa82d30':
      '0x1bd5048e0b85c410dd039aa9c05069a9d82488b8',
    '0x3f364853f01d32d581fc9734110b21c77aeea024':
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    '0xe4c2b5db9de5da0a17ed7ec7176602ad99e52624':
      '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
    '0x5bef2617ecca9a39924c09017c5f1e25efbb3ba8':
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    '0x8ece0a50a025a7e13398212a5bed2ded11959949':
      '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    '0x957da9ebbcdc97dc4a8c274dd762ec2ab665e15f':
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    '0xe631ffaa2cf4d91aac3e9589a5d5b390c82a032e':
      '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6',
    '0x791e974fd87c8d0bcaa9aa253ff4591a5957127c':
      '0x82362ec182db3cf7829014bc61e9be8a2e82868a',
    '0x0a02d33031917d836bd7af02f9f7f6c74d67805f': 'klay',
  };

  const mapping_coingecko = {
    '0xcc2a9051e904916047c26c90f41c000d4f273456': {
      coingecko: 'coingecko_ripple',
      decimals: 6,
    },
  };

  for (const address in balances) {
    if (address in mapping) {
      balances[mapping[address]] = BigNumber(
        balances[mapping[address]] || 0,
      ).plus(balances[address]);
      delete balances[address];
    }
    if (mapping_coingecko[address]) {
      balances[mapping_coingecko[address].coingecko] = BigNumber(
        balances[address],
      )
        .div(10 ** mapping_coingecko[address].decimals)
        .toFixed();
      delete balances[address];
    }
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const { balances: pairPoolBalances, poolBalances: pairPoolReserves } =
    await uniswapV2.getTvl(FACTORY_ADDRESS, block, chain, provider, web3);
  const { balances: singlePoolBalances, poolBalances: singlePoolReserves } =
    await getSinglePoolBalances(block, chain, provider, web3);
  const balances = formatter.sum([pairPoolBalances, singlePoolBalances]);
  const poolBalances = { ...pairPoolReserves, ...singlePoolReserves };

  const stakingBalance = await util.getTokenBalancesOfHolders(
    [VOTING_PROTOCOL_ADDRESS],
    [MESHSWAP_TOKEN_ADDRESS],
    block,
    chain,
    web3,
  );
  balances[MESHSWAP_TOKEN_ADDRESS] = BigNumber(
    balances[MESHSWAP_TOKEN_ADDRESS] || 0,
  ).plus(stakingBalance[0].balance);

  for (const token in balances) {
    if (BigNumber(balances[token]).isLessThan(100000)) {
      delete balances[token];
    }
  }
  convertOrbitBalances(balances);
  formatter.convertBalancesToFixed(balances);

  return { balances, poolBalances };
}
export { tvl };
