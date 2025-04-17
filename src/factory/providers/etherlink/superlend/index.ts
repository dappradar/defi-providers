import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';

const START_BLOCK = 3285355;
const POOL_DATA_PROVIDER_V3 = '0x99e8269dDD5c7Af0F1B3973A591b47E8E001BCac';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, web3 } = params;
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
