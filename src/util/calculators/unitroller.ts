import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { IBalances } from '../../interfaces/ITvl';
import basicUtil from '../basicUtil';
import util from '../blockchainUtil';
import formatter from '../formatter';
import UNITROLLER_ABI from '../../constants/abi/unitroller.json';

/**
 * Gets TVL for protocols that are based on Unitroller (Compound)
 *
 * @remarks
 * More: https://docs.compound.finance/v2/comptroller/#architecture
 *
 * @param unitrollerAddresses - The array of addresses of factories
 * @param block - The block number for which data is requested
 * @param chain - EVM chain name (providers parent folder name)
 * @param provider - the provider folder name
 * @param web3 - The Web3 object
 * @returns The object containing token addresses and their locked values
 *
 */
async function getTvl(
  unitrollerAddresses: string[],
  block: number,
  chain: string,
  provider: string,
  web3: Web3,
): Promise<IBalances> {
  let qiTokens = {};
  try {
    qiTokens = await basicUtil.readFromCache(
      'cache/pools.json',
      chain,
      provider,
    );
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

    await basicUtil.saveIntoCache(
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
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  return balances;
}

export default {
  getTvl,
};
