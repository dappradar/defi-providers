import BigNumber from 'bignumber.js';
import ABI from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import basicUtil from '../../../../util/basicUtil';

// cache some data
const COMPTROLLER_ADDRESSES = [
  '0xeB2D3A9D962d89b4A9a34ce2bF6a2650c938e185', // xDot
  '0x0fAbd597BDecb0EEE1fDFc9B8458Fe1ed0E35028', // BeamSwap
];
const WGLMR_ADDRESS = '0xacc15dc74880c9944775448304b263d191c6077f';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1338156) {
    return {};
  }

  let markets = {};
  try {
    markets = await basicUtil.readFromCache('pools.json', chain, provider);
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
        underlying || WGLMR_ADDRESS
      ).toLowerCase();
    });
  } catch {}
  await basicUtil.saveIntoCache(markets, 'pools.json', chain, provider);
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
    provider,
    web3,
  );
  return { balances };
}

export { tvl };
