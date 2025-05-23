import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const HOLDERS = [
  'CCUN4RXU5VNDHSF4S4RKV4ZJYMX2YWKOH6L4AKEKVNVDQ7HY5QIAO4UB',
  'CDCART6WRSM2K4CKOAOB5YKUVBSJ6KLOVS7ZEJHA4OAQ2FXX7JOHLXIP',
];
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;

  const balances = {};

  const tokenBalances = await web3.eth.getContractsBalances(HOLDERS);

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.mapStellarTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
