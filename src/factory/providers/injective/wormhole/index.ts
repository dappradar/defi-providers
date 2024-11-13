import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const PORTAL_ADDRESS = 'inj1ghd753shjuwexxywmgs4xz7x2q732vcnxxynfn';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  let balances = {};

  const portalBalances = await web3.eth.getAccountBalances(PORTAL_ADDRESS);
  balances = formatter.sum([balances, portalBalances]);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
