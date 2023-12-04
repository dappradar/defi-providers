import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';

const START_BLOCK = 279871224;
const END_POINT = 'https://wax.defibox.io/api/';
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const swap = (await axios.get(END_POINT + 'swap/get24HInfo')).data;
  const balances = { wax: (Number(swap.data.waxBalance) * 2).toFixed() }; // swap TVL (dual sided 50/50 AMM pool)
  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
