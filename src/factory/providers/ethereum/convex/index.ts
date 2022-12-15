import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import MULTIBALANCES_ABI from '../../../../constants/abi/multiBalances.json';
import ERC20_ABI from '../../../../constants/abi/erc20.json';
import { getPoolDetails } from './pools';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const MULTIBALANCES_ADDRESS = '0x09b6fd79f8c6bdaba4d94731f0fc90edd15742af';
const MANAGER_ADDRESS = '0xF403C135812408BFbE8713b5A23a04b3D48AAE31';
const CRV_ADDRESS = '0xd533a949740bb3306d119cc777fa900ba034cd52';
const CVX_ADDRESS = '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b';
const CVX_STAKING_ADDRESS = '0xCF50b810E57Ac33B91dCF525C6ddd9881B139332';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const E_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

const REPLACEMENTS = [
  '0x99d1fa417f94dcd62bfe781a1213c092a47041bc',
  '0x9777d7e2b60bb01759d0e2f8be2095df444cb07e',
  '0x1be5d71f2da660bfdee8012ddc58d024448a0a59',
  '0x16de59092dae5ccf4a1e6439d611fd0653f0bd01',
  '0xd6ad7a6750a7593e092a9b218d66c0a814a3436e',
  '0x83f798e925bcd4017eb265844fddabb448f1707d',
  '0x73a052500105205d34daf004eab301916da8190f',
  '0xc2cb1040220768554cf699b0d863a3cd4324ce32',
  '0x26ea744e5b887e5205727f55dfbe8685e3b21951',
  '0xe6354ed5bc4b393a5aad09f21c46e101e692d447',
  '0x04bc0ab673d88ae9dbc9da2380cb6b79c4bca9ae',
];

const BTC_REPLACEMENTS = [
  '0x075b1bb99792c9e1041ba13afef80c91a1e70fb3',
  '0x8751d4196027d4e6da63716fa7786b5174f04c15',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 12450992) {
    return {};
  }

  const multiContract = new web3.eth.Contract(
    MULTIBALANCES_ABI,
    MULTIBALANCES_ADDRESS,
  );

  const balances = {};

  const [{ output: poolLength }, cvxCRVSupply, cvxStaked] = await Promise.all([
    util.executeCall(
      MANAGER_ADDRESS,
      [abi['poolLength']],
      'poolLength',
      [],
      block,
      chain,
      web3,
    ),
    util.getTotalSupply(
      '0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7',
      block,
      web3,
    ),
    util.getTokenBalances(CVX_STAKING_ADDRESS, CVX_ADDRESS, chain, block, web3),
  ]);

  let pools = {};
  try {
    pools = basicUtil.readDataFromFile('pools.json', chain, provider);
  } catch {}

  const newPoolIndexes = [...Array(Number(poolLength)).keys()].filter(
    (i) => !pools[i],
  );
  const results = await util.executeMultiCallsOfTarget(
    MANAGER_ADDRESS,
    [abi['poolInfo']],
    'poolInfo',
    newPoolIndexes.map((index) => [index]),
    block,
    chain,
    web3,
  );
  results.forEach((result, index) => {
    if (result) {
      pools[newPoolIndexes[index]] = {
        lptoken: result.lptoken.toLowerCase(),
        token: result.token.toLowerCase(),
      };
    }
  });

  const allIndexes = Object.keys(pools);
  const [results1, results2] = await Promise.all([
    util.executeCallOfMultiTargets(
      allIndexes.map((index) => pools[index].token),
      ERC20_ABI,
      'totalSupply',
      [],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      allIndexes.map((index) => pools[index].lptoken),
      ERC20_ABI,
      'totalSupply',
      [],
      block,
      chain,
      web3,
    ),
  ]);
  const tokenTotalSupplies = {};
  const lpTokenTotalSupplies = {};
  allIndexes.forEach((index, i) => {
    tokenTotalSupplies[index] = BigNumber(results1[i] || 0);
    lpTokenTotalSupplies[index] = BigNumber(results2[i] || 0);
  });
  const CURVE_POOLS = getPoolDetails();
  await Promise.all(
    [...Array(Number(poolLength)).keys()].map(async (i) => {
      const poolData = CURVE_POOLS.find(
        (crvPool) =>
          crvPool.addresses.lpToken.toLowerCase() === pools[i].lptoken,
      );
      let swapAddress;
      if (poolData === undefined) {
        console.log(pools[i].lptoken);
        return;
      }

      // eslint-disable-next-line prefer-const
      swapAddress = poolData.addresses.swap;

      let coins = await util.executeMultiCallsOfTarget(
        swapAddress,
        [abi['coinsUint']],
        'coins',
        Array.from({ length: poolData.coins.length }, (_, i) => [i]),
        block,
        chain,
        web3,
      );

      if (!coins.find((coin) => coin)) {
        coins = await util.executeMultiCallsOfTarget(
          swapAddress,
          [abi['coinsInt']],
          'coins',
          Array.from({ length: poolData.coins.length }, (_, i) => [i]),
          block,
          chain,
          web3,
        );
      }

      coins = coins.filter((coin) => coin);

      let coinBalances = await multiContract.methods
        .tokenBalances(swapAddress, coins)
        .call(null, block);

      if (poolData.name === 'ironbank') {
        const underlyings = await util.executeCallOfMultiTargets(
          coins,
          [abi['underlying']],
          'underlying',
          [],
          block,
          chain,
          web3,
        );

        if (underlyings.find((underlying) => underlying)) {
          const exchangeRate = await util.executeCallOfMultiTargets(
            coins,
            [abi['exchangeRateStored']],
            'exchangeRateStored',
            [],
            block,
            chain,
            web3,
          );
          coins = underlyings;
          coinBalances = coinBalances.map((balance, i) =>
            BigNumber(balance).times(exchangeRate[i]).div(1e18).toFixed(),
          );
        }
      }

      await Promise.all(
        coinBalances.map(async (coinBalance, index) => {
          let coinAddress = coins[index].toLowerCase();

          if (REPLACEMENTS.includes(coinAddress)) {
            coinAddress = DAI_ADDRESS; // dai
          }

          if (BTC_REPLACEMENTS.includes(coinAddress)) {
            coinAddress = WBTC_ADDRESS;
            coinBalance = BigNumber(coinBalance).div(1e10).toFixed(0);
          }

          if (coinAddress === E_ADDRESS) {
            coinBalance = await util.getBalancesOfHolders(
              swapAddress,
              block,
              chain,
              web3,
            );
            coinAddress = WETH_ADDRESS;
          }

          const balance = tokenTotalSupplies[i]
            .times(BigNumber(coinBalance))
            .div(lpTokenTotalSupplies[i]);

          if (!balance.isZero()) {
            if (!balances[coinAddress]) {
              balances[coinAddress] = BigNumber(0);
            }
            balances[coinAddress] = balances[coinAddress].plus(
              BigNumber(balance),
            );
          }
        }),
      );
    }),
  );

  basicUtil.writeDataToFile(pools, 'pools.json', chain, provider);

  if (!balances[CRV_ADDRESS]) {
    balances[CRV_ADDRESS] = BigNumber(0);
  }
  balances[CRV_ADDRESS] = balances[CRV_ADDRESS].plus(
    BigNumber(cvxCRVSupply['output']),
  );
  if (!balances[CVX_ADDRESS]) {
    balances[CVX_ADDRESS] = BigNumber(0);
  }
  balances[CVX_ADDRESS] = balances[CVX_ADDRESS].plus(
    BigNumber(cvxStaked['output']),
  );

  for (const token in balances) {
    balances[token] = balances[token].toFixed(0);
  }
  return { balances };
}

export { tvl };
