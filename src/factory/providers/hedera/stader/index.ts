import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const STAKE_ADDRESS_V1 = '0.0.834119';
const STAKE_ADDRESS_V2 = '0.0.1027588';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;

  if (block < 1649405800) {
    return {};
  }

  const balances = {
    hbar: (
      await web3.eth.getBalance(
        block < 1656460800 ? STAKE_ADDRESS_V1 : STAKE_ADDRESS_V2,
        block,
      )
    ).toFixed(),
  };

  return { balances };
}

export { tvl };
