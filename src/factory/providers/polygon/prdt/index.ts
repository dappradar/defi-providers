import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const contracts = [
  '0xd71b0366CD2f2E90dd1F80A1F0EA540F73Ac0EF6',
  '0x59e0aD27d0F58A15128051cAA1D2917aA71AB864',
  '0x764C3Ea13e7457261E5C1AaD597F281f3e738240',
  '0x8251E5EBc2d2C20f6a116144800D569FAF75d746',
  '0x9f9564BE7b566dfE4B091a83a591752102aF3F33',
  '0x0b9c8c0a04354f41b985c10daf7db30bc66998f5',
];

const TOKENS = [
  '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < 35598746) {
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

  balances['pol'] = totalNativeBalance.toString();

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
