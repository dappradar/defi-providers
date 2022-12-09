import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const MENTO_RESERVE = '0x9380fA34Fd9e4Fd14c06305fd7B6199089eD4eb9';
const MENTO_LOCK = '0x246f4599eFD3fA67AC44335Ed5e749E518Ffd8bB';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 2947) {
    return {};
  }

  const tokenBalances = await util.getBalancesOfHolders(
    [MENTO_RESERVE, MENTO_LOCK],
    block,
    chain,
    web3,
  );

  const balances = {};

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);

  console.log(balances);

  return { balances };
}

export { tvl };
