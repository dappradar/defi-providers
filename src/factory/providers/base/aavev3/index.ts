import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';

const START_BLOCK = 2357108;
const POOL_DATA_PROVIDER_V3 = '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = await aaveV3.getTvl(
    POOL_DATA_PROVIDER_V3,
    block,
    chain,
    web3,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
