import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const ASSETS = [
  '0xDD629E5241CbC5919847783e6C96B2De4754e438',
  '0x2247B5A46BB79421a314aB0f0b67fFd11dd37Ee4',
];
async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

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
