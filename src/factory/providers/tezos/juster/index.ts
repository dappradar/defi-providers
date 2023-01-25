import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 2079070;
const CORE_CONTRACT = 'tz1YiuvpfeVAHbnU8akcWErNfQGFHNQ7F45z';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  balances['xtz'] = await web3.eth
    .getBalance(CORE_CONTRACT, block)
    .then((balance) => balance.toFixed());

  return { balances };
}

export { tvl };
