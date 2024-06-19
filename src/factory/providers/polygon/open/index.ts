import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 54913762;
const STAKING_CONTRACT = '0x686e8500B6bE8812EB198aAbbbFA14C95c03fC88';
const OPN_TOKEN = '0x7844F79FC841E4F92d974C417031c76F8578c2D5';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const tokenBalances = await util.getTokenBalances(
    STAKING_CONTRACT,
    [OPN_TOKEN],
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
