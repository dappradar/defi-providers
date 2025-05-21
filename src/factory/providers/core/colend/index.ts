import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import aaveV3 from '../../../../util/calculators/aaveV3';

const START_BLOCK = 13302591;
const POOL_DATA_PROVIDER_V3_1 = '0x567AF83d912C85c7a66d093e41D92676fA9076E3';
const POOL_DATA_PROVIDER_V3_2 = '0x8E43DF2503c69b090D385E36032814c73b746e3d';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances_1 = await aaveV3.getTvl(
    POOL_DATA_PROVIDER_V3_1,
    block,
    chain,
    web3,
  );

  const balances_2 = await aaveV3.getTvl(
    POOL_DATA_PROVIDER_V3_2,
    block,
    chain,
    web3,
  );

  const balances = formatter.sum([balances_1, balances_2]);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
