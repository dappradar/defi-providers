import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 5102947;
const OWNERS = [
  '0x9beABD8699E2306c5632C80E663dE9953e104C3f',
  '0xcDD339d704Fb8f35A3a2f7d9B064238D33DC7550',
];
const BOBA = '0xa18bF3994C0Cc6E3b63ac420308E5383f53120D7';
const USDC = '0x66a2A913e447d6b4BF33EFbec43aAeF87890FBbc';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  if (block < START_BLOCK) {
    return { balances };
  }

  const balanceResults = await util.getTokenBalancesOfHolders(
    OWNERS,
    [BOBA, USDC],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, balanceResults);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}
export { tvl };
