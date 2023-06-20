import BigNumber from 'bignumber.js';
import DTOKEN_ABI from './abi/dtoken.json';
import ITOKEN_ABI from './abi/itoken.json';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const LENDING_MARKETS = [
  '0x24677e213DeC0Ea53a430404cF4A11a6dc889FCe', // iBUSD
  '0x298f243aD592b6027d4717fBe9DeCda668E3c3A8', // iDAI
  '0xb3dc7425e63E1855Eb41107134D471DD34d7b239', // iDF
  '0x5ACD75f21659a59fFaB9AEBAf350351a8bfaAbc0', // iETH
  '0x164315EA59169D46359baa4BcC6479bB421764b6', // iGOLDx
  '0x47566acD7af49D2a192132314826ed3c3c5f3698', // iHBTC
  '0xbeC9A824D6dA8d0F923FD9fbec4FAA949d396320', // iUNI
  '0x2f956b2f801c6dad74E87E7f45c94f6283BF0f45', // iUSDC
  '0x1180c114f7fAdCB6957670432a3Cf8Ef08Ab5354', // iUSDT
  '0x5812fCF91adc502a765E5707eBB3F36a07f63c02', // iWBTC
];
const YIELD_MARKETS = [
  '0x02285AcaafEB533e03A7306C55EC031297df9224', // dDAI
  '0xF4dFc3Df8C83Be5a2ec2025491fd157c474f438a', // dPAX
  '0x55BCf7173C8840d5517424eD19b7bbF11CFb9F2B', // dTUSD
  '0x16c9cF62d8daC4a38FB50Ae5fa5d51E9170F3179', // dUSDC
  '0x868277d475E0e475E38EC5CdA2d9C83B5E1D9fc8', // dUSDT
];
let tokens = { iTokens: null, dTokens: null };

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 10509668) {
    return {};
  }

  try {
    tokens = await basicUtil.readFromCache('pairs.json', chain, provider);
  } catch {}

  if (!tokens.iTokens) {
    tokens.iTokens = {};
  }
  if (!tokens.dTokens) {
    tokens.dTokens = {};
  }

  const newLendingMarkets = LENDING_MARKETS.filter(
    (market) => !tokens.iTokens[market],
  );
  const newYieldMarkets = YIELD_MARKETS.filter(
    (market) => !tokens.dTokens[market],
  );

  const [iTokens, dTokens] = await Promise.all([
    util.executeCallOfMultiTargets(
      newLendingMarkets,
      ITOKEN_ABI,
      'underlying',
      [],
      block,
      chain,
      web3,
    ),
    util.executeCallOfMultiTargets(
      newYieldMarkets,
      DTOKEN_ABI,
      'token',
      [],
      block,
      chain,
      web3,
    ),
  ]);
  newLendingMarkets.forEach((market, index) => {
    if (iTokens[index] == util.ZERO_ADDRESS) {
      tokens.iTokens[market] = WETH_ADDRESS;
    } else {
      tokens.iTokens[market] = iTokens[index].toLowerCase();
    }
  });
  newYieldMarkets.forEach((market, index) => {
    if (dTokens[index] == util.ZERO_ADDRESS) {
      tokens.dTokens[market] = WETH_ADDRESS;
    } else {
      tokens.dTokens[market] = dTokens[index].toLowerCase();
    }
  });

  await basicUtil.saveIntoCache(tokens, 'pools.json', chain, provider);

  const [lendingBalances, yieldBalances] = await Promise.all([
    await util.executeCallOfMultiTargets(
      LENDING_MARKETS,
      ITOKEN_ABI,
      'getCash',
      [],
      block,
      chain,
      web3,
    ),
    await util.executeCallOfMultiTargets(
      YIELD_MARKETS,
      DTOKEN_ABI,
      'getTotalBalance',
      [],
      block,
      chain,
      web3,
    ),
  ]);

  const balanceResults = [];
  LENDING_MARKETS.forEach((market, index) => {
    balanceResults.push({
      token: tokens.iTokens[market],
      balance: BigNumber(lendingBalances[index] || 0),
    });
  });
  YIELD_MARKETS.forEach((market, index) => {
    balanceResults.push({
      token: tokens.dTokens[market],
      balance: BigNumber(yieldBalances[index] || 0),
    });
  });

  const tokenBalances = {};
  formatter.sumMultiBalanceOf(tokenBalances, balanceResults);

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
