import BigNumber from 'bignumber.js';
import abi from './abi.json';
import { tvl as v2TVL } from './v2';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const SHITCOINS = [
  '0x9be89d2a4cd102d8fecc6bf9da793be995c22541',
  '0x9afb950948c2370975fb91a441f36fdc02737cd4',
  '0xbb2b8038a1640196fbe3e38816f3e67cba72d940',
  '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
  '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
  '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
];

const COMPTROLLER = '0x3d5BC3c8d13dcB8bF317092d84783c2697AE9258';
const BLACK_MARKETS = ['0xBdf447B39D152d6A234B4c02772B8ab5D1783F72'];
const crETH = '0xD06527D5e56A3495252A528C4987003b712860eE';
const wETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const yETH = '0xe1237aA7f535b0CC33Fd973D66cBf830354D16c7';
const yCrv = '0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8';
const ySwap = '0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51';
const yUSD = '0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c';
const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const CRETH2 = '0xcBc1065255cBc3aB41a6868c22d1f1C573AB89fd';
const CRETH2SLP = '0x71817445d11f42506f2d7f54417c935be90ca731';

async function getAllCTokens(block, chain, web3) {
  const cTokens = await util.executeCall(
    COMPTROLLER,
    [abi['getAllMarkets']],
    'getAllMarkets',
    [],
    block,
    chain,
    web3,
  );
  return cTokens.filter(function (cToken) {
    return BLACK_MARKETS.indexOf(cToken) === -1;
  });
}

async function getAllUnderlying(block, cTokens, chain, web3) {
  const cERC20s = cTokens.filter((cToken) => cToken !== crETH);
  const results = await util.executeCallOfMultiTargets(
    cERC20s,
    [abi['underlying']],
    'underlying',
    [],
    block,
    chain,
    web3,
  );
  const allUnderlying = cERC20s.map((cERC20, index) => ({
    token: cERC20,
    underlying: results[index],
  }));
  allUnderlying.push({
    token: crETH,
    underlying: wETH,
  });
  return allUnderlying;
}

async function getCashes(block, cTokens, chain, web3) {
  const cashResults = await util.executeCallOfMultiTargets(
    cTokens,
    [abi['getCash']],
    'getCash',
    [],
    block,
    chain,
    web3,
  );
  return cTokens.map((cToken, index) => ({
    token: cToken,
    balance: BigNumber(cashResults[index] || 0),
  }));
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  let balances = {};

  if (block < 10583489) return balances;

  const cTokens = await getAllCTokens(block, chain, web3);
  const [
    allUnderlying,
    cashes,
    v2Balances,
    yETHPirce,
    yUSDPrice,
    yCrvPrice,
    creth2Reserve,
  ] = await Promise.all([
    getAllUnderlying(block, cTokens, chain, web3),
    getCashes(block, cTokens, chain, web3),
    v2TVL(params),
    block > 10774539
      ? await util.executeCall(
          yETH,
          [abi['getPricePerFullShare']],
          'getPricePerFullShare',
          [],
          block,
          chain,
          web3,
        )
      : 1e18,
    ,
    await util.executeCall(
      yUSD,
      [abi['getPricePerFullShare']],
      'getPricePerFullShare',
      [],
      block,
      chain,
      web3,
    ),
    await util.executeCall(
      ySwap,
      [abi['get_virtual_price']],
      'get_virtual_price',
      [],
      block,
      chain,
      web3,
    ),
    block > 11508720
      ? await util.executeCall(
          CRETH2SLP,
          [abi['getReserves']],
          'getReserves',
          [],
          block,
          chain,
          web3,
        )
      : {
          _reserve0: 1,
          _reserve1: 1,
        },
  ]);
  balances = v2Balances;

  // CRETH2 price = (WETH amount / CRETH2 amount) in Sushiswap pool
  const creth2Price = BigNumber(creth2Reserve._reserve0)
    .multipliedBy(1e18)
    .div(creth2Reserve._reserve1)
    .integerValue();

  cTokens.forEach((cToken) => {
    let getCash = cashes.find(
      (result) => result.token === cToken && result.balance.isGreaterThan(0),
    );
    let underlying = allUnderlying.find(
      (result) => result.token === cToken && result.underlying,
    );
    if (getCash && underlying) {
      getCash = getCash.balance;
      underlying = underlying.underlying;
      if (underlying === yETH) {
        const ethCash = BigNumber(balances[wETH] || 0);
        const yETHCash = getCash
          .multipliedBy(yETHPirce)
          .div(1e18)
          .integerValue();
        if (!balances[wETH.toLowerCase()]) balances[wETH.toLowerCase()] = 0;
        balances[wETH.toLowerCase()] =
          BigNumber(balances[wETH.toLowerCase()])
            .plus(ethCash)
            .plus(yETHCash)
            .toFixed() || '0';
        delete balances[underlying];
      } else if (underlying === CRETH2) {
        const ethCash = BigNumber(balances[wETH] || 0);
        const creth2Cash = getCash
          .multipliedBy(creth2Price)
          .div(1e18)
          .integerValue();
        if (!balances[wETH.toLowerCase()]) balances[wETH.toLowerCase()] = 0;
        balances[wETH.toLowerCase()] =
          BigNumber(balances[wETH.toLowerCase()])
            .plus(ethCash)
            .plus(creth2Cash)
            .toFixed() || '0';
        delete balances[underlying];
      } else if (underlying === yCrv) {
        const usdcCash = BigNumber(balances[usdc] || 0);
        const yCrvCash = getCash
          .multipliedBy(yCrvPrice)
          .div(1e18)
          .div(1e12)
          .integerValue();
        if (!balances[usdc.toLowerCase()]) balances[usdc.toLowerCase()] = 0;
        balances[usdc.toLowerCase()] =
          BigNumber(balances[usdc.toLowerCase()])
            .plus(usdcCash)
            .plus(yCrvCash)
            .toFixed() || '0';
        delete balances[underlying];
      } else if (underlying === yUSD) {
        const usdcCash = BigNumber(balances[usdc] || 0);
        const yUSDCash = getCash
          .multipliedBy(yUSDPrice)
          .div(1e18)
          .multipliedBy(yCrvPrice)
          .div(1e18)
          .div(1e12)
          .integerValue();
        if (!balances[usdc.toLowerCase()]) balances[usdc.toLowerCase()] = 0;
        balances[usdc.toLowerCase()] =
          BigNumber(balances[usdc.toLowerCase()])
            .plus(usdcCash)
            .plus(yUSDCash)
            .toFixed() || '0';
        delete balances[underlying];
      } else if (underlying) {
        const cash = BigNumber(balances[underlying] || 0);
        if (!balances[underlying.toLowerCase()])
          balances[underlying.toLowerCase()] = 0;
        balances[underlying.toLowerCase()] =
          BigNumber(balances[underlying.toLowerCase()])
            .plus(cash)
            .plus(getCash)
            .toFixed() || '0';
      }
    }
  });

  SHITCOINS.forEach((coin) => delete balances[coin]);
  return { balances };
}

export { tvl };
