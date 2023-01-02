import util from '../../../../util/blockchainUtil';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const POOL = '0x541eC7c03F330605a2176fCD9c255596a30C00dB';
const TOKENS = [
  '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664', // USDC
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  if (block < 8872902) {
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
