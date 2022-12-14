import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const POOL = '0xD8b19613723215EF8CC80fC35A1428f8E8826940';
const TOKENS = [
  '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d', // USDC
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1188678) {
    return {};
  }

  const tokenBalances = await util.getTokenBalances(
    POOL,
    TOKENS,
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
