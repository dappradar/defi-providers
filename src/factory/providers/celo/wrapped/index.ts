import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 6568486;
const TOKENS = [
  '0xD629eb00dEced2a080B7EC630eF6aC117e614f1b', // CBTC
  '0x2def4285787d58a2f811af24755a8150622f4361', // CETH
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};

  const totalSupplies = await util.getTokenTotalSupplies(
    TOKENS,
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
