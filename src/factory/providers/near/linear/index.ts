import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 61147683;
const LINEAR_CONTRACT = 'linear-protocol.near';
const WRAP_NEAR_ADDRESS = 'wrap.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  balances[WRAP_NEAR_ADDRESS] = await web3.eth.callContractFunction(
    LINEAR_CONTRACT,
    'get_total_staked_balance',
    {},
    block,
  );

  return { balances };
}

export { tvl };
