import BigNumber from 'bignumber.js';
import abi from './abi.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const AAVE_LENDING_POOL_CORE = '0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3';
const UNISWAP_LENDING_POOL_CORE = '0x1012cfF81A1582ddD0616517eFB97D02c5c17E25';
const AAVE_STAKING_ADDRESS = '0x4da27a545c0c5b758a6ba100e3a049001de870f5';
const AAVE_TOKEN_ADDRESS = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';
const PROVIDERV2_ADDRESS = '0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const UNISWAPV1_ADDRESSES = [
  '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667',
  '0x97dec872013f6b5fb443861090ad931542878126',
  '0xe9cf7887b93150d4f2da7dfc6d502b216438f244',
  '0xcaa7e4656f6a2b59f5f99c745f91ab26d1210dce',
  '0x2c4bd064b998838076fa341a83d007fc2fa50957',
  '0xf173214c720f58e03e194085b1db28b50acdeead',
];

let aaveReserves = [];
let uniswapReserves = [];

async function _getV1Assets(lendingPoolCore, block, chain, web3) {
  const reserves = await util.executeCall(
    lendingPoolCore,
    [abi['getReserves']],
    'getReserves',
    [],
    block,
    chain,
    web3,
  );

  const assets = [];

  if (!reserves) {
    return null;
  }

  reserves.map((reserve) => {
    if (reserve === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') return;
    assets.push({
      address: reserve,
    });
  });

  return assets;
}

async function _multiMarketV1Tvl(
  lendingPoolCore,
  reserves,
  block,
  chain,
  web3,
) {
  const balances = {
    [WETH_ADDRESS]: await web3.eth.getBalance(lendingPoolCore, block),
  };

  const balanceOfResults = await util.getTokenBalances(
    lendingPoolCore,
    reserves.map((reserve) => reserve.address),
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceOfResults);

  return balances;
}

async function getV1Reserves(block, chain, web3) {
  if (!aaveReserves || aaveReserves.length === 0) {
    aaveReserves = await _getV1Assets(
      AAVE_LENDING_POOL_CORE,
      block,
      chain,
      web3,
    );
  }

  if (!uniswapReserves || uniswapReserves.length === 0) {
    // Does not take into account Uniswap LP assets (not yet supported on DeFiPulse)
    uniswapReserves = await _getV1Assets(
      UNISWAP_LENDING_POOL_CORE,
      block,
      chain,
      web3,
    );
  }
}

async function getV2Data(block, chain, provider, web3) {
  const aTokenMarketData = await util.executeCall(
    PROVIDERV2_ADDRESS,
    [abi['getAllATokens']],
    'getAllATokens',
    [],
    block,
    chain,
    web3,
  );

  const aTokenAddresses = [];
  aTokenMarketData.map((aTokensData, i) => {
    aTokenAddresses[i] = aTokensData.split(',')[1];
  });

  await basicUtil.saveIntoCache(
    aTokenAddresses,
    'cache/aTokens.json',
    chain,
    provider,
  );

  const underlyingAddressesDict = await util.executeCallOfMultiTargets(
    aTokenAddresses,
    [abi['getUnderlying']],
    'UNDERLYING_ASSET_ADDRESS',
    [],
    block,
    chain,
    web3,
  );

  const balanceOfUnderlying = await util.getTokenBalancesOfHolders(
    aTokenAddresses,
    aTokenAddresses.map((aToken, index) => underlyingAddressesDict[index]),
    block,
    chain,
    web3,
  );

  const v2Data = balanceOfUnderlying.map((underlying) => {
    return {
      underlying: underlying.token,
      balance: underlying.balance.toFixed(),
    };
  });

  return v2Data;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  // V1 TVLs
  await getV1Reserves(block, chain, web3);

  const v2Data = await getV2Data(block, chain, provider, web3);

  const stakedBalance = await util.getTokenBalances(
    AAVE_STAKING_ADDRESS,
    [AAVE_TOKEN_ADDRESS],
    block,
    chain,
    web3,
  );

  const balances = await _multiMarketV1Tvl(
    AAVE_LENDING_POOL_CORE,
    aaveReserves,
    block,
    chain,
    web3,
  );

  const uniswapMarketTvlBalances = await _multiMarketV1Tvl(
    UNISWAP_LENDING_POOL_CORE,
    uniswapReserves,
    block,
    chain,
    web3,
  );

  if (uniswapMarketTvlBalances) {
    // ...add v1 uniswap market TVL
    Object.keys(uniswapMarketTvlBalances).forEach((address) => {
      let convertAddress = UNISWAPV1_ADDRESSES.includes(address.toLowerCase())
        ? WETH_ADDRESS
        : address;
      convertAddress = convertAddress.toLowerCase();
      if (balances[convertAddress]) {
        balances[convertAddress] = BigNumber(balances[convertAddress]).plus(
          uniswapMarketTvlBalances[address],
        );
      } else {
        balances[convertAddress] = uniswapMarketTvlBalances[address];
      }
    });
  }

  formatter.sumMultiBalanceOf(balances, stakedBalance);

  // V2 TVLs
  if (v2Data) {
    v2Data.map((data) => {
      const underlying = data.underlying;
      if (balances[underlying]) {
        balances[underlying] = BigNumber(balances[underlying]).plus(
          data.balance,
        );
      } else {
        balances[underlying] = data.balance;
      }
    });
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
