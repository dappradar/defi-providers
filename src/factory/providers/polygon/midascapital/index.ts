import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

const COMPTROLLER_ADDRESSES = [
  '0xD265ff7e5487E9DD556a4BB900ccA6D087Eb3AD2', // Jarvis jFIAT
  '0xB08A309eFBFFa41f36A06b2D0C9a4629749b17a2', // Arrakis X Midas
  '0xBd82D36B9CDfB9747aA12025CeCE3782EDe767FE', // Midas Live on Polygon
];
const WMATIC_ADDRESS = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 31428285) {
    return {};
  }

  let markets = {};
  try {
    markets = basicUtil.readDataFromFile('pools.json', chain, provider);
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
        underlying || WMATIC_ADDRESS
      ).toLowerCase();
    });
  } catch {}

  await basicUtil.writeDataToFile(markets, 'pools.json', chain, provider);

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
