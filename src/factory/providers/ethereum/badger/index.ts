import BigNumber from 'bignumber.js';
import SETT_ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESSES = [
  {
    tokenAddress: '0x110492b31c59716ac47337e616804e3e3adc0b4a',
    settAddress: '0x1862A18181346EBd9EdAf800804f89190DeF24a5',
    startBlock: 11539649,
  },
  {
    tokenAddress: '0xceff51756c56ceffca006cd410b03ffc46dd3a58',
    settAddress: '0x758a43ee2bff8230eeb784879cdcff4828f2544d',
    startBlock: 11539829,
  },
  {
    tokenAddress: '0xcd7989894bc033581532d2cd88da5db0a4b12859',
    settAddress: '0x235c9e24D3FB2FAFd58a2E49D454Fdcd2DBf7FF1',
    startBlock: 11380951,
  },
  {
    tokenAddress: '0xe86204c4eddd2f70ee00ead6805f917671f56c52',
    settAddress: '0xC17078FDd324CC473F8175Dc5290fae5f2E84714',
    startBlock: 11680833,
  },
  {
    tokenAddress: '0x9a13867048e01c663ce8ce2fe0cdae69ff9f35e3',
    settAddress: '0x88128580ACdD9c04Ce47AFcE196875747bF2A9f6',
    startBlock: 11681030,
  },
  {
    tokenAddress: '0x3472a5a71965499acd81997a54bba8d852c6e53d',
    settAddress: '0x19D97D8fA813EE2f51aD4B4e04EA08bAf4DFfC28',
    startBlock: 11380946,
  },
  {
    tokenAddress: '0x49849c98ae39fff122806c06791fa73784fb3675',
    settAddress: '0x6dEf55d2e18486B9dDfaA075bc4e4EE0B28c1545',
    baseTokenAddress: '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d',
    offsetDecimal: 10,
    startBlock: 11380947,
  },
  {
    tokenAddress: '0x075b1bb99792c9e1041ba13afef80c91a1e70fb3',
    settAddress: '0xd04c48A53c111300aD41190D63681ed3dAd998eC',
    baseTokenAddress: '0xfe18be6b3bd88a2d2a7f928d00292e7a9963cfc6',
    startBlock: 11380949,
  },
  {
    tokenAddress: '0x64eda51d3ad40d56b9dfc5554e06f94e1dd786fd',
    settAddress: '0xb9D076fDe463dbc9f915E5392F807315Bf940334',
    baseTokenAddress: '0x8daebade922df735c38c80c7ebd708af50815faa',
    startBlock: 11380950,
  },
  {
    tokenAddress: '0x49849c98ae39fff122806c06791fa73784fb3675',
    settAddress: '0xAf5A1DECfa95BAF63E0084a35c62592B774A2A87',
    baseTokenAddress: '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d',
    offsetDecimal: 10,
    startBlock: 11380956,
  },
  {
    tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    settAddress: '0x4b92d19c11435614CD49Af1b589001b7c08cD4D5',
    startBlock: 11680422,
  },
  {
    tokenAddress: '0x798d1be841a82a273720ce31c822c61a67a601c3',
    settAddress: '0x7e7E112A68d8D2E221E11047a72fFC1065c38e1a',
    startBlock: 12246710,
  },
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  const results1 = await util.executeCallOfMultiTargets(
    POOL_ADDRESSES.map((pool) => pool.settAddress),
    SETT_ABI,
    'balance',
    [],
    block,
    chain,
    web3,
  );
  const results2 = await util.executeCallOfMultiTargets(
    POOL_ADDRESSES.map((pool) => pool.settAddress),
    SETT_ABI,
    'totalAssets',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = POOL_ADDRESSES.map((pool, index) => ({
    token: pool.baseTokenAddress || pool.tokenAddress,
    balance: new BigNumber(results1[index] || results2[index]),
  }));

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );

  return { balances };
}

export { tvl };
