import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 4174;
const HOLDER_ADDRESS = '0xb8f275fBf7A959F4BCE59999A2EF122A099e81A8';
const USDC_ADDRESSES = ['0x66a2A913e447d6b4BF33EFbec43aAeF87890FBbc'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  const balances = {};

  if (block < START_BLOCK) {
    return { balances };
  }

  const tokenBalances = await util.getTokenBalances(
    HOLDER_ADDRESS,
    USDC_ADDRESSES,
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
