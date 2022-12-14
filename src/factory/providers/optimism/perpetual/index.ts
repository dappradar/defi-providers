import formatter from '../../../../util/formatter';
import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 513580;
const VAULT = '0xAD7b4C162707E0B2b5f6fdDbD3f8538A5fbA0d60';
const TOKENS = ['0x7f5c764cbc14f9669b88837ca1490cca17c31607'];

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
