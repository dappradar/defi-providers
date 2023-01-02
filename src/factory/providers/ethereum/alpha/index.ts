import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import abi from './abi.json';
import startBlocks from './startBlocks.json';
import LEGACY_POOLS from './legacyPools.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { log } from '../../../../util/logger/logger';

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const CORE_ORACLE_ADDRESS = '0x1e5bddd0cdf8839d6b27b34927869ef0ad7bf692';
const CHEF_ADDRESS = '0x373ae78a14577682591e088f2e78ef1417612c68';
const LIQUIDITY_GAUGE = '0xfdb4f97953150e47c8606758c13e70b5a789a7ec';
const ALPHAV2_GRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/hermioneeth/alpha-homora-v2-mainnet';

const GET_TOTAL_COLLATERALS = `
  query GET_TOTAL_COLLATERALS($block: Int) {
    werc20Collaterals(block: { number: $block }) {
      lpToken
      amount
    }
    sushiswapCollaterals(block: { number: $block }) {
      pid
      amount
    }
    crvCollaterals(block: { number: $block }) {
      pid
      gid
      amount
    }
    wstakingRewardCollaterals(block: { number: $block }) {
      wtoken
      amount
    }
  }
`;
const GET_CY_TOKEN = `
  query GET_CY_TOKEN($cyToken: String, $block: Int) {
    cyTokenStates(
      where: { cyToken: $cyToken }
      first: 1
      orderBy: blockTimestamp
      orderDirection: desc
      block: { number: $block }
    ) {
      id
      cyToken
      safeboxBalance
      exchangeRate
      blockTimestamp
    }
  }
`;

async function tvlV1(block, chain, web3) {
  const startBlock = 11007158;

  if (block < startBlock) {
    return BigNumber(0);
  }

  const pool_v1 = await fetch(
    'https://homora.alphafinance.io/static/contracts.json',
  ).then((res) => res.json());

  const bankAddress = pool_v1.bankAddress.toLowerCase();

  let pools = pool_v1.pools;

  let uniswapPools = pools.filter(
    (pool) => pool.exchange === 'Uniswap' || pool.exchange === 'IndexCoop',
  );

  let sushiswapPools = pools.filter(
    (pool) => pool.exchange === 'Sushi' || pool.exchange === 'Pickle',
  );

  uniswapPools = uniswapPools.filter(
    (pool) => startBlocks[pool.goblinAddress.toLowerCase()] <= block,
  );
  sushiswapPools = sushiswapPools.filter(
    (pool) => startBlocks[pool.goblinAddress.toLowerCase()] <= block,
  );

  pools = [...uniswapPools, ...sushiswapPools];

  const bankContract = new web3.eth.Contract(
    [abi['totalETH'], abi['glbDebtVal']],
    bankAddress,
  );
  const [_totalETH, _totalDebt] = await Promise.all([
    bankContract.methods.totalETH().call(null, block),
    bankContract.methods.glbDebtVal().call(null, block),
  ]);

  const totalETH = BigNumber(_totalETH);
  const totalDebt = BigNumber(_totalDebt);

  // Uniswap Pools
  const uniLPBalanceResults = await util.getTokenBalancesOfHolders(
    uniswapPools.map((pool) => pool.goblinAddress),
    uniswapPools.map((pool) => pool.lpStakingAddress),
    block,
    chain,
    web3,
  );
  const _UnilpTokens = uniLPBalanceResults.map((result) => ({
    output: result.balance,
  }));

  const _SushilpTokens = await util.executeMultiCallsOfMultiTargets(
    sushiswapPools.map((pool) => pool.lpStakingAddress),
    [abi['userInfo']],
    'userInfo',
    sushiswapPools.map((pool) => [[pool.id], pool.goblinAddress]),
    block,
    chain,
    web3,
  );

  const _lpTokens = [
    ..._UnilpTokens,
    ..._SushilpTokens.map((x) => ({
      output: x[0],
    })),
  ];

  const lpTokens = _lpTokens.map((_lpToken) => BigNumber(_lpToken.output || 0));

  const wethBalancesRestuls = await util.getTokenBalancesOfHolders(
    pools.map((pool) => pool.lpTokenAddress),
    pools.map((pool) => WETH_ADDRESS),
    block,
    chain,
    web3,
  );
  const totalETHOnStakings = wethBalancesRestuls.map(
    (result) => result.balance,
  );

  const totalSupplyResults = await util.getTokenTotalSupplies(
    pools.map((pool) => pool.lpTokenAddress),
    block,
    chain,
    web3,
  );
  const totalLpTokens = totalSupplyResults.map((result) => result.totalSupply);

  const unUtilizedValue = totalETH.minus(totalDebt);

  let tvl = BigNumber(unUtilizedValue);
  for (let i = 0; i < lpTokens.length; i++) {
    if (totalLpTokens[i].gt(0)) {
      const amount = lpTokens[i]
        .times(totalETHOnStakings[i])
        .div(totalLpTokens[i])
        .times(BigNumber(2));

      tvl = tvl.plus(amount);
    }
  }

  return tvl;
}

async function tvlV2(block, chain, web3) {
  if (block < 11766939) {
    return 0;
  }

  const [collaterals, cyTokens] = await Promise.all([
    getTotalCollateral(block),
    getCyTokens(block),
  ]);

  const tokens = Array.from(
    new Set([
      ...collaterals
        .map((collateral) => collateral.lpTokenAddress)
        .filter((lpToken) => !!lpToken),
      ...cyTokens.map((cy) => cy.token).filter((token) => !!token),
    ]),
  );

  const tokenPrices = await getTokenPrices(tokens, block, chain, web3);

  const totalCollateralValue = BigNumber.sum(
    0, // Default value
    ...collaterals.map((collateral) => {
      if (collateral.lpTokenAddress in tokenPrices) {
        return BigNumber(collateral.amount).times(
          tokenPrices[collateral.lpTokenAddress],
        );
      }
      return BigNumber(0);
    }),
  );

  const totalCyValue = BigNumber.sum(
    0,
    ...cyTokens.map((cy) => {
      if (cy.token in tokenPrices) {
        return BigNumber(cy.amount).times(tokenPrices[cy.token]);
      }
      return BigNumber(0);
    }),
  );

  return totalCollateralValue.plus(totalCyValue);
}

async function getCyTokens(block) {
  const safebox = await fetch(
    'https://homora-api.alphafinance.io/v2/1/safeboxes',
  ).then((res) => res.json());

  return Promise.all(
    safebox.map(async (sb) => {
      const cyToken = sb.cyTokenAddress;
      const { cyTokenStates } = await fetch(ALPHAV2_GRAPH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GET_CY_TOKEN,
          variables: {
            block,
            cyToken,
          },
        }),
      })
        .then((res) => res.json())
        .then((data) => data.data);

      const cyTokenState = cyTokenStates[0];
      if (!cyTokenState) {
        return { amount: new BigNumber(0), token: null };
      }
      const exchangeRate = new BigNumber(cyTokenState.exchangeRate).div(1e18);
      const cyBalance = new BigNumber(cyTokenState.safeboxBalance);
      return { amount: cyBalance.times(exchangeRate), token: sb.address };
    }),
  );
}

async function getTokenPrices(tokens, block, chain, web3) {
  const _ethPrices = await util.executeMultiCallsOfTarget(
    CORE_ORACLE_ADDRESS,
    [abi['getETHPx']],
    'getETHPx',
    tokens.map((token) => [token]),
    block,
    chain,
    web3,
  );

  const tokenPrices = {};
  for (let i = 0; i < _ethPrices.length; i++) {
    if (_ethPrices[i]) {
      const price = BigNumber(_ethPrices[i] || 0).div(BigNumber(2).pow(112));
      if (price.gte(0)) {
        tokenPrices[tokens[i]] = price;
      }
    }
  }
  return tokenPrices;
}

async function getTotalCollateral(block) {
  const pools = await fetch(
    'https://homora-api.alphafinance.io/v2/1/pools',
  ).then((res) => res.json());
  pools.push(...LEGACY_POOLS);

  const {
    crvCollaterals,
    sushiswapCollaterals,
    werc20Collaterals,
    wstakingRewardCollaterals,
  } = await fetch(ALPHAV2_GRAPH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_TOTAL_COLLATERALS,
      variables: {
        block,
      },
    }),
  })
    .then((res) => res.json())
    .then((data) => data.data);

  const collaterals = [
    ...crvCollaterals.map((coll) => {
      const pool = pools.find(
        (pool) =>
          pool.wTokenAddress === LIQUIDITY_GAUGE &&
          Number(coll.pid) === pool.pid &&
          Number(coll.gid) === pool.gid,
      );
      if (!pool) {
        return {
          lpTokenAddress: null,
          amount: BigNumber(0),
        };
      }
      return {
        lpTokenAddress: pool.lpTokenAddress ? pool.lpTokenAddress : null,
        amount: BigNumber(coll.amount),
      };
    }),
    ...sushiswapCollaterals.map((coll) => {
      const pool = pools.find(
        (pool) =>
          pool.wTokenAddress === CHEF_ADDRESS && Number(coll.pid) === pool.pid,
      );
      if (!pool) {
        return {
          lpTokenAddress: null,
          amount: BigNumber(0),
        };
      }
      return {
        lpTokenAddress: pool.lpTokenAddress ? pool.lpTokenAddress : null,
        amount: BigNumber(coll.amount),
      };
    }),
    ...werc20Collaterals.map((coll) => ({
      lpTokenAddress:
        '0x' +
        BigNumber(coll.lpToken).toString(16).padStart(40, '0').toLowerCase(),
      amount: BigNumber(coll.amount),
    })),
    ...wstakingRewardCollaterals.map((coll) => {
      const pool = pools.find((pool) => pool.wTokenAddress === coll.wtoken);
      if (!pool) {
        return {
          lpTokenAddress: null,
          amount: BigNumber(0),
        };
      }
      return {
        lpTokenAddress: pool.lpTokenAddress ? pool.lpTokenAddress : null,
        amount: BigNumber(coll.amount),
      };
    }),
  ];

  return collaterals;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 11011665) {
    return {};
  }
  try {
    const balances = {
      [WETH_ADDRESS]: '0', // WETH
    };

    const tvls = await Promise.all([
      tvlV1(block, chain, web3),
      tvlV2(block, chain, web3),
    ]);

    const tvl = BigNumber.sum(...tvls);
    balances[WETH_ADDRESS] = tvl.toFixed();

    return { balances };
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of ethereum/alpha`,
      endpoint: 'tvl',
    });
  }
}

export {
  tvl, // tvl adapter
};
