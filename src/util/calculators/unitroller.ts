import BigNumber from 'bignumber.js';
import basicUtil from '../basicUtil';
import util from '../blockchainUtil';
import formatter from '../formatter';
import UNITROLLER_ABI from '../../constants/abi/unitroller.json';

async function getTvl(unitrollerAddresses, block, chain, provider, web3) {
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
    chain,
    web3,
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
      chain,
      web3,
    );

    underlyings.forEach((underlying, index) => {
      qiTokens[newMarkets[index]] = (
        underlying || basicUtil.getWmainAddress(chain)
      ).toLowerCase();
    });

    await basicUtil.writeDataToFile(
      qiTokens,
      'cache/pools.json',
      chain,
      provider,
    );
  }

  const results = await util.executeCallOfMultiTargets(
    allMarkets,
    UNITROLLER_ABI,
    'getCash',
    [],
    block,
    chain,
    web3,
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
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  return balances;
}

export default {
  getTvl,
};
