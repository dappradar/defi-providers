import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 279871224;
const accounts = ['atomicmarket'];
const tokens = [['eosio.token', 'wax', 'wax']];
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = await web3.eth.get_account_tvl(accounts, tokens, 'wax');

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
