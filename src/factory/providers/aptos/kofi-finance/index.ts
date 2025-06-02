import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3 } = params;
  const balances = {};

  try {
    const supply = await web3.eth.functionView({
      functionStr:
        '0x2cc52445acc4c5e5817a0ac475976fbef966fedb6e30e7db792e10619c76181f::rewards_manager::get_staked_apt',
      type_arguments: [],
      args: [],
    });

    if (supply && supply !== '0') {
      formatter.merge(balances, '0x1::aptos_coin::aptoscoin', supply);
    }
  } catch (error) {
    console.log('Error fetching Kofi Finance data:', error);
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
