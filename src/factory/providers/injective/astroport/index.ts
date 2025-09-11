import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import cosmosDex from '../../../../util/calculators/cosmosDex';
import BigNumber from 'bignumber.js';

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

  if (balances['inj18luqttqyckgpddndh8hvaq25d5nfwjc78m56lc']) {
    balances['inj'] = BigNumber(balances['inj'] || 0)
      .plus(balances['inj18luqttqyckgpddndh8hvaq25d5nfwjc78m56lc'])
      .toFixed();
    delete balances['inj18luqttqyckgpddndh8hvaq25d5nfwjc78m56lc'];
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
