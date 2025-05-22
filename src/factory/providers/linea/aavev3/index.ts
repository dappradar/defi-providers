import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';

const START_BLOCK = 12430826;
const POOL_DATA_PROVIDER_V3 = '0x2D97F8FA96886Fd923c065F5457F9DDd494e3877';

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
