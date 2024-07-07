import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESS = 'EQCLyZHP4Xe8fpchQz76O-_RmUhaVc_9BAoGyJrwJrcbz2eZ';
const METHOD = 'get_treasury_state';
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
