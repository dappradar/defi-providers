import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 14043002;
const VAULT = '0x4ecB5300D9ec6BCA09d66bfd8Dcb532e3192dDA1';
const TOKENS = ['0x625E7708f30cA75bfd92586e17077590C60eb4cD'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  const balanceResults = await util.getTokenBalances(
    VAULT,
    TOKENS,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
