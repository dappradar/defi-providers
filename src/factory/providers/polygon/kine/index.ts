import BigNumber from 'bignumber.js';
import UNITROLLER_ABI from './abi.json';
import CTOKEN_ABI from '../../../../constants/abi/cToken.json';
import { WMAIN_ADDRESS } from '../../../../constants/contracts.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const UNITROLLER_ADDRESS = '0xdff18ac4146d67bf2ccbe98e7db1e4fa32b96881';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 18372388) {
    return {};
  }

  let markets = {};
  try {
    markets = await basicUtil.readFromCache('pools.json', chain, provider);
  } catch {}

  const allMarkets = await util.executeCall(
    UNITROLLER_ADDRESS,
    UNITROLLER_ABI,
    'getAllMarkets',
    [],
    block,
    chain,
    web3,
  );

  const newMarkets = allMarkets.filter((market) => !markets[market]);

  if (newMarkets.length > 0) {
    const underlyings = await util.executeCallOfMultiTargets(
      newMarkets,
      CTOKEN_ABI,
      'underlying',
      [],
      block,
      chain,
      web3,
    );

    underlyings.forEach((underlying, index) => {
      markets[newMarkets[index]] = (
        underlying || WMAIN_ADDRESS.polygon
      ).toLowerCase();
    });

    await basicUtil.savedIntoCache(markets, 'pools.json', chain, provider);
  }

  const results = await util.executeDifferentCallsOfMultiTargets(
    allMarkets,
    CTOKEN_ABI,
    allMarkets.map((_) => 'getCash'),
    allMarkets.map((_) => []),
    block,
    chain,
    web3,
  );

  const tokenBalances = [];

  results.forEach((result, index) => {
    if (result) {
      tokenBalances.push({
        token: markets[allMarkets[index]],
        balance: BigNumber(result),
      });
    }
  });

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
