import unitroller from '../../../../util/calculators/unitroller';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 60837829;
const UNITROLLER_ADDRESSES = [
  '0x6De54724e128274520606f038591A00C5E94a1F6',
  '0xA195b3d7AA34E47Fb2D2e5A682DF2d9EFA2daF06',
  '0xe1cf09BDa2e089c63330F0Ffe3F6D6b790835973',
  '0xE550A886716241AFB7ee276e647207D7667e1E79',
];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await unitroller.getTvl(
    UNITROLLER_ADDRESSES,
    block,
    chain,
    provider,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
