import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const {
    data: { supply },
  } = (
    await web3.eth.query(
      '/accounts/0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114/resource/0x1::coin::CoinInfo%3C0x84d7aeef42d38a5ffc3ccef853e1b82e4958659d16a7de736a29c55fbbeb0114::staked_aptos_coin::StakedAptosCoin%3E',
    )
  ).data;

  return {
    balances: {
      '0x1::aptos_coin::aptoscoin': supply.vec[0].integer.vec[0].value,
    },
  };
}
export { tvl };
