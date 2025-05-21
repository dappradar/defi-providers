import unitroller from '../../../../util/calculators/unitroller';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 20276858;
const UNITROLLER_ADDRESSES = ['0x7f5a7aE2688A7ba6a9B36141335044c058a08b3E'];

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
