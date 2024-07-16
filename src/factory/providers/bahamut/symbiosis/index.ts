import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 1854856;
const HOLDER_ADDRESSES = ['0x318C2B9a03C37702742C3d40C72e4056e430135A'];
const USDC_ADDRESSES = ['0x4237e0A5b55233D5B6D6d1D9BF421723954130D8'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const tokenBalances = await util.getTokenBalancesOfEachHolder(
    HOLDER_ADDRESSES,
    USDC_ADDRESSES,
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
