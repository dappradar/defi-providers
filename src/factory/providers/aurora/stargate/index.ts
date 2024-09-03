import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import stargateV2 from '../../../../util/calculators/stargateV2';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const balances = {};

  const v2TokenBalances = await stargateV2.getV2Tvl(chain, block, web3);
  formatter.sumMultiBalanceOf(balances, v2TokenBalances);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
