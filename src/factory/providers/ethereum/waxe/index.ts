import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
const WEAP_ADDRESS = '0x894f3a40ab8051b350f85b3edeb7c7b83fcb6dac';
const WAXG_ADDRESS = '0xb140A429c342083E97Daf42d5D82634bd7Ade7d4';
const WAXE_ETH_LP = '0x0ee0cb563a52ae1170ac34fbb94c50e89adde4bd';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 11538969) {
    return {};
  }

  const [lpBalance, ethBalances] = await Promise.all([
    util.getTokenBalances(WEAP_ADDRESS, [WAXE_ETH_LP], block, chain, web3),
    util.getBalancesOfHolders([WEAP_ADDRESS, WAXG_ADDRESS], block, chain, web3),
  ]);

  const tokenBalances = {};

  formatter.sumMultiBalanceOf(tokenBalances, lpBalance);
  formatter.sumMultiBalanceOf(tokenBalances, ethBalances);

  const balances = await util.convertToUnderlyings(
    tokenBalances,
    block,
    chain,
    provider,
    web3,
  );
  return { balances };
}

export { tvl };
