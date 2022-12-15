import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 15388422;
const VAULT = '0xd5a8f233cbddb40368d55c3320644fb36e597002';
const TOKENS = ['0x7f5c764cbc14f9669b88837ca1490cca17c31607'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

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
