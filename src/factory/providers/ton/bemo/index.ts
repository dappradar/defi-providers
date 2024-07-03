import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESS = 'EQDNhy-nxYFgUqzfUzImBEP67JqsyMIcyk2S5_RwNNEYku0k';
const METHOD = 'get_full_data';
const TON_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};
  const response = await web3.eth.call(CONTRACT_ADDRESS, METHOD);

  balances[TON_ADDRESS] = response[1];

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
