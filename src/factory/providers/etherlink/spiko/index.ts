import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 6453772;
const ASSETS = [
  '0xe4880249745eAc5F1eD9d8F7DF844792D560e750',
  '0xa0769f7A8fC65e47dE93797b4e21C073c117Fc80',
];
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = {};

  const totalSupplies = await util.getTokenTotalSupplies(
    ASSETS,
    block,
    chain,
    web3,
  );

  totalSupplies.forEach((token) => {
    if (token && token.totalSupply.isGreaterThan(0)) {
      balances[token.token] = token.totalSupply.toFixed();
    }
  });

  return { balances };
}

export { tvl };
