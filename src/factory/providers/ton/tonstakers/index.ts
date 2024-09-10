import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const CONTRACT_ADDRESS = 'EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR';
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
