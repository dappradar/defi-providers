import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const {
    data: { supply },
  } = (
    await web3.eth.query(
      '/accounts/0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a/resource/0x1::coin::CoinInfo%3C0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt%3E',
    )
  ).data;

  return {
    balances: {
      '0x1::aptos_coin::aptoscoin': supply.vec[0].integer.vec[0].value,
    },
  };
}
export { tvl };
