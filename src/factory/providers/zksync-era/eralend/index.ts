import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import unitroller from '../../../../util/calculators/unitroller';

const START_BLOCK = 561367;
const ERALEND_CONTRACT = '0x0171cA5b372eb510245F5FA214F5582911934b3D';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return { balances: {} };
  }

  const balances = await unitroller.getTvl(
    [ERALEND_CONTRACT],
    block,
    chain,
    provider,
    web3,
  );

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
