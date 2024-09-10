import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESS = 'EQBPAMNu5Eud9AEvplOjNlRhxI4EkuJEhEMAmxh9erxmImKs';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = await web3.eth.getAccountBalances(CONTRACT_ADDRESS);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
