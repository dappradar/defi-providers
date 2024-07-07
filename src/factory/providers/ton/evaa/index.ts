import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESS = 'EQC8rUZqR_pWV1BylWUlPNBzyiTYVoBEmQkMIQDZXICfnuRr';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = await web3.eth.getAccountBalances(CONTRACT_ADDRESS);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
