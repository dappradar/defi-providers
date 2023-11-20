import unitroller from '../../../../util/calculators/unitroller';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';

const START_BLOCK = 2622215;
const UNITROLLER_ADDRESSES = ['0x6056Eb6a5634468647B8cB892d3DaA5F816939FC'];
const AQUARIUS_LOAN_TOKEN = '0x204e2D49b7cDA6d93301bcF667A2Da28Fb0e5780';
const STAKING_CONTRACT = '0x959C7898318DC3c8fD11cbC5000f4e36F75144EC';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await unitroller.getTvl(
    UNITROLLER_ADDRESSES,
    block,
    chain,
    provider,
    web3,
  );

  const balanceResults = await util.getTokenBalances(
    STAKING_CONTRACT,
    [AQUARIUS_LOAN_TOKEN],
    block,
    chain,
    web3,
  );
  formatter.sumMultiBalanceOf(balances, balanceResults, chain, provider);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
