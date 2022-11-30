/*==================================================
  Modules
  ==================================================*/

import BigNumber from 'bignumber.js';
import basicUtil from '../../sdk/helpers/basicUtil';
import util from '../../sdk/util';
import UNITROLLER_ABI from './abi/unitroller.json';

/*==================================================
  Helper Methods
  ==================================================*/

async function getTvl(unitrollerAddresses, block, chain, provider) {
  let qiTokens = {};
  try {
    qiTokens = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const marketResults = await util.executeCallOfMultiTargets(
    unitrollerAddresses,
    UNITROLLER_ABI,
    'getAllMarkets',
    [],
    block,
    null,
    chain,
  );

  const allMarkets = [];
  marketResults.forEach((result) => {
    if (result) {
      allMarkets.push(...result);
    }
  });

  const newMarkets = allMarkets.filter((market) => !qiTokens[market]);

  if (newMarkets.length > 0) {
    const underlyings = await util.executeCallOfMultiTargets(
      newMarkets,
      UNITROLLER_ABI,
      'underlying',
      [],
      block,
      null,
      chain,
    );

    underlyings.forEach((underlying, index) => {
      qiTokens[newMarkets[index]] = (
        underlying || basicUtil.getWmainAddress(chain)
      ).toLowerCase();
    });

    basicUtil.writeDataToFile(qiTokens, 'cache/pools.json', chain, provider);
  }

  const results = await util.executeCallOfMultiTargets(
    allMarkets,
    UNITROLLER_ABI,
    'getCash',
    [],
    block,
    null,
    chain,
  );

  const tokenBalances = [];
  results.forEach((result, index) => {
    if (result) {
      tokenBalances.push({
        token: qiTokens[allMarkets[index]],
        balance: BigNumber(result),
      });
    }
  });

  const balances = {};
  util.sumMultiBalanceOf(balances, tokenBalances);
  return balances;
}

/*==================================================
  Exports
  ==================================================*/

export default {
  getTvl,
};
