import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { IBalances } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import util from '../../../../util/blockchainUtil';
import abi from './abi.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 7379;
const UNITROLLER_ADDRESSES = [
  '0x009a0b7C38B542208936F1179151CD08E2943833',
  '0x43Eac5BFEa14531B8DE0B334E123eA98325de866',
];
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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
    abi,
    'allMarkets',
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
      abi,
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
    abi,
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

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = await getTvl(
    UNITROLLER_ADDRESSES,
    block,
    chain,
    provider,
    web3,
  );

  if (balances[ZERO_ADDRESS]) {
    balances['eth'] = balances[ZERO_ADDRESS];
    delete balances[ZERO_ADDRESS];
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
