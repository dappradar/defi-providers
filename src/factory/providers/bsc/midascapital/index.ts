import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

// cache some data
const COMPTROLLER_ADDRESSES = [
  '0x31d76A64Bc8BbEffb601fac5884372DEF910F044', // Jarvis
  '0xb2234eE69555EE4C3b6cEA4fd25c4979BbDBf0fd', // Risedile
  '0xEF0B026F93ba744cA3EDf799574538484c2C4f80', // AutoHedge
  '0x5373C052Df65b317e48D6CAD8Bb8AC50995e9459', // BOMB
  '0xfeB4f9080Ad40ce33Fd47Ff6Da6e4822fE26C7d5', // Ankr
  '0xd3E5AAFebBF06A071509cf894f665710dDaa800d', // Tester
  '0x3F239A5C45849391E7b839190597B5130780790d', // Pancake Stack
  '0x47FE09AeED6545aE66f5f2309EC52828164Aa6D5', // test
  '0x11355CF65a9B76e5Ac4C289362fD7c22eE93E762', // Midas Test Pool
];
const WBNB_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 18169502) {
    return {};
  }

  let markets = {};
  try {
    markets = basicUtil.readDataFromFile('cache/markets.json', chain, provider);
  } catch {}

  try {
    const comptrollerAllMarkets = await util.executeCallOfMultiTargets(
      COMPTROLLER_ADDRESSES,
      ABI,
      'getAllMarkets',
      [],
      block,
      chain,
      web3,
    );
    const allMarkets = [];
    comptrollerAllMarkets.forEach((comptrollerMarkets) => {
      if (comptrollerMarkets) {
        allMarkets.push(...comptrollerMarkets);
      }
    });
    const newMarkets = allMarkets.filter(
      (market) => !markets[market.toLowerCase()],
    );
    const underlyings = await util.executeCallOfMultiTargets(
      newMarkets,
      ABI,
      'underlying',
      [],
      block,
      chain,
      web3,
    );
    underlyings.forEach((underlying, index) => {
      markets[newMarkets[index].toLowerCase()] = (
        underlying || WBNB_ADDRESS
      ).toLowerCase();
    });
  } catch {}

  basicUtil.writeDataToFile(markets, 'cache/markets.json', chain, provider);

  const marketList = Object.keys(markets);
  // Get V1 tokens locked
  const results = await util.executeCallOfMultiTargets(
    marketList,
    ABI,
    'getCash',
    [],
    block,
    chain,
    web3,
  );

  const balanceResults = [];
  results.forEach((result, index) => {
    if (result) {
      balanceResults.push({
        token: markets[marketList[index]],
        balance: BigNumber(result),
      });
    }
  });

  const tokenBalances = {};

  formatter.sumMultiBalanceOf(tokenBalances, balanceResults, chain, provider);

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
