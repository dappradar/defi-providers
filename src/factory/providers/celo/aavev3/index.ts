import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';

const START_BLOCK = 30390066;
const POOL_DATA_PROVIDER_V3 = '0x33b7d355613110b4E842f5f7057Ccd36fb4cee28';

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
