import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const STINJ_ADDRESS = 'inj10fd06xl4q6jp9qlhemvm6ymmm83ppj2g8rzquw';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  let balances = {};

  const accountBalances = await web3.eth.getAccountBalances(STINJ_ADDRESS);
  balances = formatter.sum([balances, accountBalances]);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
