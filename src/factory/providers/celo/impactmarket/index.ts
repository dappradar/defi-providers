import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 10494981;
const PACT_DELEGATOR = '0x8f8bb984e652cb8d0aa7c9d6712ec2020eb1bab4';
const TOKENS = ['0x46c9757c5497c5b1f2eb73ae79b6b67d119b0b58'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  const balanceResults = await util.getTokenBalances(
    PACT_DELEGATOR,
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
