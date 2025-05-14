import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const HOLDERS = ['GDESDYZS5TQE6ADZDIC4WLAMLCJLZEEUKSO2UXTFTAQSHLFCQICIIYDA'];
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;

  const balances = {};

  const tokenBalances = await web3.eth.getAccountsBalances(HOLDERS);

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.mapStellarTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
