import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 45803832;
const META_POOL_CONTRACT = 'meta-pool.near';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  balances['near'] = await web3.eth.callContractFunction(
    META_POOL_CONTRACT,
    'ft_total_supply',
    {},
    block,
  );
  return { balances };
}

export { tvl };
