import BigNumber from 'bignumber.js';
import abi from './abi.json';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';
import { WMAIN_ADDRESS } from '../../../../constants/contracts.json';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import { AbiItem } from 'web3-utils';

const UNITROLLER_ADDRESS = '0x486af39519b4dc9a7fccd318217352830e8ad9b4';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 3046286) {
    return {};
  }

  let qiTokens = {};
  try {
    qiTokens = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const allMarkets = await util.executeCall(
    UNITROLLER_ADDRESS,
    abi as AbiItem[],
    'getAllMarkets',
    [],
    block,
    chain,
    web3,
  );

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
        underlying || WMAIN_ADDRESS.avalanche
      ).toLowerCase();
    });

    basicUtil.writeDataToFile(qiTokens, 'cache/pools.json', chain, provider);
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
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  console.log(balances);

  return { balances };
}

export { tvl };
