import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESS = 'EQAfF5j3JMIpZlLmACv7Ub7RH7WmiVMuV4ivcgNYHvNnqHTz';
const METHOD = 'get_minter_data';
const TON_ADDRESS = 'ton';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  const response = await web3.eth.call(CONTRACT_ADDRESS, METHOD);

  balances[TON_ADDRESS] = response[0];

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
