import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import cosmosDex from '../../../../util/calculators/cosmosDex';

const ASTROPORT_FACTORY_ADDRESS = 'inj19aenkaj6qhymmt746av8ck4r8euthq3zmxr2r6';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = await cosmosDex.getTvl(
    ASTROPORT_FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
