import BigNumber from 'bignumber.js';
import COMPTROLLER_ABI from './abis/comptroller.json';
import DIRECTORY_ABI from './abis/directory.json';
import POOL_ABI from './abis/pool.json';
import LENS_ABI from './abis/lens.json';
import FTOKEN_ABI from './abis/ftoken.json';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const FUSEPOOL_DIRECTORY = '0x835482FE0532f169024d5E9410199369aAD5C77E';
const FUSEPOOL_LENS_ADDRESS = '0x8dA38681826f4ABBe089643D2B3fE4C6e4730493';
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const ETHPOOL_ADDRESSES = [
  '0xD9F223A36C2e398B0886F945a7e556B41EF91A3C',
  '0xa422890cbBE5EAa8f1c88590fBab7F319D7e24B6',
  '0x3f4931a8e9d4cdf8f56e7e8a8cfe3bede0e43657',
];
const DAIPOOL_ADDRESSES = [
  '0x7C332FeA58056D1EF6aB2B2016ce4900773DC399',
  '0x3F579F097F2CE8696Ae8C417582CfAFdE9Ec9966',
];
const STABLEPOOL_ADDRESSES = [
  '0x4a785fa6fcd2e0845a24847beb7bddd26f996d4d',
  '0x27C4E34163b5FD2122cE43a40e3eaa4d58eEbeaF',
  '0x318cfd99b60a63d265d2291a4ab982073fbf245d',
  '0xb6b79D857858004BF475e4A57D4A446DA4884866',
  '0xD4be7E211680e12c08bbE9054F0dA0D646c45228',
  '0xB202cAd3965997f2F5E67B349B2C5df036b9792e',
  '0xe4deE94233dd4d7c2504744eE6d34f3875b3B439',
];
const YIELD_ADDRESSES = [
  '0x35DDEFa2a30474E64314aAA7370abE14c042C6e8',
  '0x6dd8e1Df9F366e6494c2601e515813e0f9219A88',
];
const TOKENS = {
  DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  TUSD: '0x0000000000085d4780b73119b644ae5ecd22b376',
  BUSD: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
  SUSD: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
  MUSD: '0xe2f2a5c287993345a840db3b0845fbc70f5935a5',
};

async function getETHPoolBalances(addresses, block, chain, web3) {
  const balances = [];

  try {
    const ethPoolData = await util.executeCallOfMultiTargets(
      addresses,
      POOL_ABI,
      'getRawFundBalances',
      [],
      block,
      chain,
      web3,
    );

    ethPoolData.forEach((data) => {
      if (data) {
        const ethAmount = BigNumber(data['0']);
        if (ethAmount.isGreaterThan(0)) {
          balances.push({
            token: WETH_ADDRESS,
            balance: ethAmount,
          });
        }
      }
    });
  } catch {}

  return balances;
}

async function getPoolBalances(addresses, block, chain, web3) {
  const balances = [];

  try {
    const earnPoolData = await util.executeCallOfMultiTargets(
      addresses,
      POOL_ABI,
      'getRawFundBalancesAndPrices',
      [],
      block,
      chain,
      web3,
    );

    earnPoolData.forEach((data) => {
      if (data && data['0'] && data['0'].length > 0) {
        const tokens = data['0'].split(',');
        const amounts = data['1'].split(',');
        const poolsData = data['2'].split(',');
        const balanceData = data['3'].split(',');
        for (let j = 0; j < tokens.length; j++) {
          const tokenAddress = TOKENS[tokens[j].toUpperCase()];
          if (tokenAddress) {
            const tokenAmount = BigNumber(amounts[j]);
            if (tokenAmount.isGreaterThan(0)) {
              balances.push({
                token: tokenAddress,
                balance: tokenAmount,
              });
            }
            const pools = poolsData[j];
            const poolBalances = balanceData[j];
            if (pools && poolBalances && pools.length === poolBalances.length) {
              for (let i = 0; i < pools.length; i++) {
                const poolBalance = BigNumber(poolBalances[i]);
                if (poolBalance.isGreaterThan(0)) {
                  balances.push({
                    token: tokenAddress,
                    balance: poolBalance,
                  });
                }
              }
            }
          }
        }
      }
    });
  } catch {}

  return balances;
}

async function getMarketBalances(pools, block, chain, web3) {
  const balances = [];

  try {
    const allMarkets = await util.executeCallOfMultiTargets(
      pools,
      COMPTROLLER_ABI,
      'getAllMarkets',
      [],
      block,
      chain,
      web3,
    );

    let markets = [];
    allMarkets.forEach((result) => {
      if (result) {
        markets = markets.concat(result);
      }
    });

    const [cashes, underlyings] = await Promise.all([
      util.executeCallOfMultiTargets(
        markets,
        FTOKEN_ABI,
        'getCash',
        [],
        block,
        chain,
        web3,
      ),
      util.executeCallOfMultiTargets(
        markets,
        FTOKEN_ABI,
        'underlying',
        [],
        block,
        chain,
        web3,
      ),
    ]);

    cashes.forEach((cash, index) => {
      if (cash && underlyings[index]) {
        const balance = BigNumber(cash);
        if (balance.isGreaterThan(0)) {
          balances.push({
            token: underlyings[index].toLowerCase(),
            balance,
          });
        }
      }
    });
  } catch {}

  return balances;
}

async function getPoolSummary(contract, pool, block) {
  try {
    const result = await contract.methods
      .getPoolSummary(pool)
      .call(null, block);
    return result;
  } catch {}

  return null;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 10365230) {
    return {};
  }

  const tokenBalances = {
    [WETH_ADDRESS]: BigNumber(0),
  };

  const failedPools = [];
  try {
    const fusePools = [];
    const publicPoolResults = await util.executeCall(
      FUSEPOOL_DIRECTORY,
      DIRECTORY_ABI,
      'getPublicPools',
      [],
      block,
      chain,
      web3,
    );
    let isComptroller = false;
    publicPoolResults[1].split(',').forEach((result) => {
      if (result.startsWith('0x') && result.length == 42) {
        if (isComptroller) {
          fusePools.push(result);
        }
        isComptroller = !isComptroller;
      }
    });

    const fusePoolContract = new web3.eth.Contract(
      LENS_ABI,
      FUSEPOOL_LENS_ADDRESS,
    );
    const poolSummaries = await Promise.all(
      fusePools.map((pool) => getPoolSummary(fusePoolContract, pool, block)),
    );

    poolSummaries.forEach((result, index) => {
      if (result) {
        const balance = BigNumber(result[0]).minus(result[1]);
        if (balance.isGreaterThan(0)) {
          tokenBalances[WETH_ADDRESS] =
            tokenBalances[WETH_ADDRESS].plus(balance);
        }
      } else {
        failedPools.push(fusePools[index]);
      }
    });
  } catch {}

  const results = await Promise.all([
    getETHPoolBalances(ETHPOOL_ADDRESSES, block, chain, web3),
    getPoolBalances(YIELD_ADDRESSES, block, chain, web3),
    getPoolBalances(DAIPOOL_ADDRESSES, block, chain, web3),
    getPoolBalances(STABLEPOOL_ADDRESSES, block, chain, web3),
    getMarketBalances(failedPools, block, chain, web3),
  ]);

  results.forEach((result) => {
    formatter.sumMultiBalanceOf(tokenBalances, result);
  });

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    web3,
  );
  return { balances };
}

export { tvl };
