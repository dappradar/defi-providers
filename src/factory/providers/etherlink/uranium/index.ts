import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const ASSETS = ['0x79052Ab3C166D4899a1e0DD033aC3b379AF0B1fD'];
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
