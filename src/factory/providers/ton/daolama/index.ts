import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESS = 'EQAwsDboFl_iGuaflNn5959HOamenkvQEQDwakO55CY2SGB8';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = await web3.eth.getAccountBalances(CONTRACT_ADDRESS);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
