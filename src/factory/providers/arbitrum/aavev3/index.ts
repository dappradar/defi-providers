import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';

const START_BLOCK = 11700000;
const POOL_DATA_PROVIDER_V3 = '0x69fa688f1dc47d4b5d8029d5a35fb7a548310654';

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
