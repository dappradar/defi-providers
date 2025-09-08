import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';

const START_BLOCK = 12371146;
const POOLS = [
  '0x50DCB4Fd921164C42B7129DA884D3F45a9f45917',
  '0x9A888Fba243570fCe8D82144A1f93712a1236940',
];
const TOKEN = '0x7a7c9db510aB29A2FC362a4c34260BEcB5cE3446';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = {};

  const tokenBalances = await util.getTokenBalancesOfHolders(
    POOLS,
    [TOKEN],
    block,
    chain,
    web3,
  );

  formatter.sumMultiBalanceOf(balances, tokenBalances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
