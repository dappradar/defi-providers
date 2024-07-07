import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESS = 'EQD2_4d91M4TVbEBVyBF8J1UwpMJc361LKVCz6bBlffMW05o';
const METHOD = 'get_pool_full_data';
const TON_ADDRESS = 'ton';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  const response = await web3.eth.call(CONTRACT_ADDRESS, METHOD);

  balances[TON_ADDRESS] = response[2];

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
