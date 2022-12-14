import formatter from '../../../../util/formatter';
import curve from '../../../../util/calculators/curve';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 396325;
const FACTORY = '0x4244eB811D6e0Ef302326675207A95113dB4E1F8';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = await curve.getTvl(FACTORY, block, chain, provider, web3);

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
