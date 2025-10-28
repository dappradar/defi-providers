import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const contracts = [
  '0x062EB9830D1f1f0C64ac598eC7921f0cbD6d4841',
  '0xe2ca0a434effea151d5b2c649b754acd3c8a20f0',
  '0xd9632d09518D940E307580Dd1D7B4abd22A77dd4',
];

const TOKENS = [
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 161201193) {
    return {};
  }

  const balances = {};
  let totalNativeBalance = new BigNumber(0);

  for (const contract of contracts) {
    const tokenBalances = await util.getTokenBalances(
      contract,
      TOKENS,
      block,
      chain,
      web3,
    );

    const nativeBalance = await web3.eth.getBalance(contract, block);

    formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
    totalNativeBalance = totalNativeBalance.plus(nativeBalance);
  }

  balances['eth'] = totalNativeBalance.toString();

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
