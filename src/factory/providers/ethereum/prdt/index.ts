import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const contracts = [
  '0x062EB9830D1f1f0C64ac598eC7921f0cbD6d4841',
  '0x792b18ec0d39093f10f8b34676e2f8669a495e9b',
  '0xd9632d09518D940E307580Dd1D7B4abd22A77dd4',
];

const TOKENS = [
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 18662621) {
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
