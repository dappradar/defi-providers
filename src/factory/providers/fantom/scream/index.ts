import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';
import UNITROLLER_ABI from './abi.json';
import CTOKEN_ABI from '../../../../constants/abi/cToken.json';
import { WMAIN_ADDRESS } from '../../../../constants/contracts.json';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
const UNITROLLER_ADDRESS = '0x260e596dabe3afc463e75b6cc05d8c46acacfb09';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 12149629) {
    return {};
  }

  let markets = {};
  try {
    markets = await basicUtil.readDataFromFile(
      'cache/pools.json',
      chain,
      provider,
    );
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
        underlying || WMAIN_ADDRESS.fantom
      ).toLowerCase();
    });

    basicUtil.writeDataToFile(markets, 'cache/pools.json', chain, provider);
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
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
