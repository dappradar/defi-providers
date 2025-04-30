import util from '../../../../util/blockchainUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const OWNERS = '0x0c532e1e916219007f244e2d8Ef46f8530Ec75DE';
const USDC = '0x796ea11fa2dd751ed01b53c372ffdb4aaa8f00f9';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;

  const proxyBalance = await util.getTokenBalancesOfEachHolder(
    [OWNERS],
    [USDC],
    block,
    chain,
    web3,
  );

  const balances = {};
  formatter.sumMultiBalanceOf(balances, proxyBalance);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
