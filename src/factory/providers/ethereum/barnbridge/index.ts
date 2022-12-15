import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL_ADDRESS = '0xb0fa2beee3cf36a7ac7e99b885b48538ab364853';
const TOKENS = [
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
  '0x6b175474e89094c44da98b954eedeac495271d0f',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < 11050452) {
    return {};
  }

  const balances = {};
  const balanceResults = await util.getTokenBalances(
    POOL_ADDRESS,
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
