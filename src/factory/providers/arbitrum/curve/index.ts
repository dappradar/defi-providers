import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import abi from '../../ethereum/curve/abi.json';
import BigNumber from 'bignumber.js';
import curve from '../../../../util/calculators/curve';

const POOLS = [
  '0x59bf0545fca0e5ad48e13da269facd2e8c886ba4',
  '0x741aea6c7707b39bd950da945f84d6b8ba455d48',
  '0x2ce5fd6f6f4a159987eac99ff5158b7b62189acf',
  '0xab174ffa530c888649c44c4d21c849bbaabc723f',
];
const ADDRESS_PROVIDERS = '0x0000000022D53366457F9d5E68Ec105046FC4383';
const BASE_TOKENS = {
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee':
    '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  '0xdbf31df14b66535af65aac99c32e9ea844e14501':
    '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
  '0xeb466342c4d449bc9f53a865d5cb90586f405215':
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
};

function convertToBaseToken(address) {
  const token = address.toLowerCase();
  if (!BASE_TOKENS[token]) {
    return token;
  }
  return BASE_TOKENS[token];
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const poolInfo = {};
  const CurveRegistryAddress = await util.executeCall(
    ADDRESS_PROVIDERS.toLowerCase(),
    [abi['get_registry']],
    'get_registry',
    [],
    block,
    chain,
    web3,
  );

  const poolCount = await util.executeCall(
    CurveRegistryAddress.toLowerCase(),
    [abi['pool_count']],
    'pool_count',
    [],
    block,
    chain,
    web3,
  );

  const pools = await util.executeMultiCallsOfTarget(
    CurveRegistryAddress,
    [abi['pool_list']],
    'pool_list',
    Array.from({ length: poolCount }, (v, i) => [i]),
    block,
    chain,
    web3,
  );
  pools.push(...POOLS);
  const getBalanceCalls = [];
  for (let i = 0; i < pools.length; i++) {
    getBalanceCalls.push(curve.getPoolBalance(pools[i], block, chain, web3));
  }

  const balanceResults = await Promise.all(getBalanceCalls);
  for (const result of balanceResults) {
    if (result) {
      poolInfo[result.poolAddress] = result.poolInfo;
    }
  }
  const tokenBalances = {};
  const poolKeys = Object.keys(poolInfo);
  for (let i = 0; i < poolKeys.length; i++) {
    const coinKeys = Object.keys(poolInfo[poolKeys[i]]);
    for (let x = 0; x < coinKeys.length; x++) {
      const coinBaseCoinKey = convertToBaseToken(coinKeys[x]);

      if (!tokenBalances[coinBaseCoinKey]) tokenBalances[coinBaseCoinKey] = 0;

      tokenBalances[coinBaseCoinKey] = BigNumber(
        tokenBalances[coinBaseCoinKey],
      ).plus(poolInfo[poolKeys[i]][coinKeys[x]]);
    }
  }

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  return { balances };
}
export { tvl };
