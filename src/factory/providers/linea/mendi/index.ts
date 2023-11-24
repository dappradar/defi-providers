import unitroller from '../../../../util/calculators/unitroller';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 215970;
const UNITROLLER_ADDRESSES = ['0x1b4d3b0421dDc1eB216D230Bc01527422Fb93103'];

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return {};
  }

  const balances = await unitroller.getTvl(
    UNITROLLER_ADDRESSES,
    block,
    chain,
    provider,
    web3,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}
export { tvl };
