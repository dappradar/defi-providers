import BigNumber from 'bignumber.js';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import abi from './abi.json';
import startBlocks from './startBlocks.json';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const CURVE_ADDRESS_PROVIDER = '0x0000000022d53366457f9d5e68ec105046fc4383';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const FACTORY_ADDRESS = '0x0959158b6040D32d04c301A72CBFD6b39E21c9AE';
const REGISTRY_START = 11218787;

const BASE_TOKENS = {
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee':
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  '0xc2cb1040220768554cf699b0d863a3cd4324ce32':
    '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0x26ea744e5b887e5205727f55dfbe8685e3b21951':
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0xe6354ed5bc4b393a5aad09f21c46e101e692d447':
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0x04bc0ab673d88ae9dbc9da2380cb6b79c4bca9ae':
    '0x4fabb145d64652a948d72533023f6e7a623c7c53',
  '0x16de59092dae5ccf4a1e6439d611fd0653f0bd01':
    '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0x028171bca77440897b824ca71d1c56cac55b68a3':
    '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0x3ed3b47dd13ec9a98b44e6204a523e766b225811':
    '0xdac17f958d2ee523a2206206994597c13d831ec7',
};

const CURVE_POOLS = [
  '0xeDf54bC005bc2Df0Cc6A675596e843D28b16A966',
  '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
  '0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27',
  '0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56',
  '0x4f062658EaAF2C1ccf8C8e36D6824CDf41167956',
  '0x4CA9b3063Ec5866A4B82E437059D2C43d1be596F',
  '0x3eF6A01A0f81D6046290f3e2A8c5b843e738E604',
  '0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171',
  '0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6',
  '0x06364f10B501e868329afBc005b3492902d6C763',
  '0x93054188d876f558f4a66B2EF1d97d16eDf0895B',
  '0xC18cC39da8b11dA8c3541C598eE022258F9744da',
  '0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714',
  '0xA5407eAE9Ba41422680e2e00537571bcC53efBfD',
  '0xC25099792E9349C7DD09759744ea681C7de2cb66',
  '0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb',
  '0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1',
  '0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C',
  '0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51',
  '0x8038C01A0390a8c547446a0b2c18fc9aEFEcc10c',
  '0x071c661B4DeefB59E2a3DdB20Db036821eeE8F4b',
  '0xd81dA8D904b52208541Bade1bD6595D8a251F8dd',
  '0x7F55DDe206dbAD629C080068923b36fe9D6bDBeF',
  '0x890f4e345B1dAED0367A877a1612f86A1f86985f',
  '0x0Ce6a5fF5217e38315f87032CF90686C96627CAA',
  '0xc5424B857f758E906013F3555Dad202e4bdB4567',
  '0xDeBF20617708857ebe4F679508E7b7863a8A8EeE',
];

async function getPoolBalance(poolAddress, block, chain, web3) {
  if (block < startBlocks[poolAddress.toLowerCase()]) {
    return null;
  }

  const poolInfo = {};
  let coins = await util.executeMultiCallsOfTarget(
    poolAddress,
    [abi['coins128']],
    'coins',
    Array.from({ length: 20 }, (v, i) => [i]),
    block,
    chain,
    web3,
  );
  coins = coins.filter((coin) => coin);
  if (coins.length == 0) {
    coins = await util.executeMultiCallsOfTarget(
      poolAddress,
      [abi['coins256']],
      'coins',
      Array.from({ length: 20 }, (v, i) => [i]),
      block,
      chain,
      web3,
    );
    coins = coins.filter((coin) => coin);
  }

  const results = await util.executeCallOfMultiTargets(
    coins,
    ERC20_ABI,
    'balanceOf',
    [poolAddress],
    block,
    chain,
    web3,
  );
  coins.forEach((coin, index) => {
    poolInfo[coin] = BigNumber(results[index] || 0);
  });

  return {
    poolAddress,
    poolInfo,
  };
}

function convertToBaseToken(address) {
  const token = address.toLowerCase();
  if (!BASE_TOKENS[token]) {
    return token;
  }
  return BASE_TOKENS[token];
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const registryStart = block > REGISTRY_START;
  const tokenBalances = {};

  const curvestETHBalance = await util.getBalancesOfHolders(
    ['0xDC24316b9AE028F1497c275EB9192a3Ea0f67022'],
    block,
    chain,
    web3,
  );
  const curvesETHBalance = await util.getBalancesOfHolders(
    ['0xDC24316b9AE028F1497c275EB9192a3Ea0f67022'],
    block,
    chain,
    web3,
  );

  tokenBalances[WETH_ADDRESS] = BigNumber(curvestETHBalance[0].balance)
    .plus(BigNumber(curvesETHBalance[0].balance))
    .toFixed();

  const poolInfo = {};
  let CurveRegistryAddress;

  if (registryStart) {
    CurveRegistryAddress = await util.executeCall(
      CURVE_ADDRESS_PROVIDER,
      [abi['get_registry']],
      'get_registry',
      [],
      block,
      chain,
      web3,
    );
  }

  const poolCount = registryStart
    ? await util.executeCall(
        CurveRegistryAddress,
        [abi['pool_count']],
        'pool_count',
        [],
        block,
        chain,
        web3,
      )
    : CURVE_POOLS.length;

  const pools = await util.executeMultiCallsOfTarget(
    CurveRegistryAddress,
    [abi['pool_list']],
    'pool_list',
    Array.from({ length: poolCount }, (v, i) => [i]),
    block,
    chain,
    web3,
  );

  const getBalanceCalls = [];
  for (let i = 0; i < poolCount; i++) {
    getBalanceCalls.push(
      getPoolBalance(
        registryStart ? pools[i] : CURVE_POOLS[i],
        block,
        chain,
        web3,
      ),
    );
  }

  const balanceResults = await Promise.all(getBalanceCalls);
  for (const result of balanceResults) {
    if (result) {
      poolInfo[result.poolAddress] = result.poolInfo;
    }
  }

  const poolKeys = Object.keys(poolInfo);
  for (let i = 0; i < poolKeys.length; i++) {
    const coinKeys = Object.keys(poolInfo[poolKeys[i]]);

    for (let x = 0; x < coinKeys.length; x++) {
      const coinBaseCoinKey = convertToBaseToken(coinKeys[x]);

      if (!tokenBalances[coinBaseCoinKey]) tokenBalances[coinBaseCoinKey] = 0;

      tokenBalances[coinBaseCoinKey] = BigNumber(tokenBalances[coinBaseCoinKey])
        .plus(poolInfo[poolKeys[i]][coinKeys[x]])
        .toFixed();
    }
  }

  //Get Factory Balances
  const factoryPoolCount = await util.executeCall(
    FACTORY_ADDRESS,
    [abi['pool_count']],
    'pool_count',
    [],
    block,
    chain,
    web3,
  );

  const poolLists = await util.executeMultiCallsOfTarget(
    FACTORY_ADDRESS,
    [abi['pool_list']],
    'pool_list',
    Array.from({ length: factoryPoolCount }, (_, i) => [i]),
    block,
    chain,
    web3,
  );

  const poolCoins = await util.executeMultiCallsOfTarget(
    FACTORY_ADDRESS,
    [abi['get_coins']],
    'get_coins',
    poolLists.map((address) => [address]),
    block,
    chain,
    web3,
  );

  const poolCoinBalances = await util.executeMultiCallsOfTarget(
    FACTORY_ADDRESS,
    [abi['get_balances']],
    'get_balances',
    poolLists.map((address) => [address]),
    block,
    chain,
    web3,
  );

  const coinBalances = [];
  poolLists.forEach((_, index) => {
    poolCoins[index].forEach((coin, i) => {
      coinBalances.push({
        token: coin.toLowerCase(),
        balance: BigNumber(poolCoinBalances[index][i]),
      });
    });
  });

  formatter.sumMultiBalanceOf(tokenBalances, coinBalances);
  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );

  delete balances['0x6c3f90f043a72fa612cbac8115ee7e52bde6e490'];
  delete balances['0x075b1bb99792c9e1041ba13afef80c91a1e70fb3'];
  delete balances['0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8'];
  return { balances };
}

export { tvl };
