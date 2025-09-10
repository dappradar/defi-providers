import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';
import cosmosDex from '../../../../util/calculators/cosmosDex';

const DINJ_ADDRESS = 'inj17glv5mk2pvhpwkdjljacmr2fx9pfc3djepy6xh';
const INJ_ADDRESS = 'inj';
const STATE_METHOD = 'state';
const FACTORY_ADDRESS = 'inj1pc2vxcmnyzawnwkf03n2ggvt997avtuwagqngk';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  let balances = {};

  balances[INJ_ADDRESS] = BigNumber(balances[INJ_ADDRESS] || 0).plus(
    await web3.eth
      .call(DINJ_ADDRESS, STATE_METHOD)
      .then((data) => data.tvl_utoken),
  );

  const dexBalances = await cosmosDex.getTvl(
    FACTORY_ADDRESS,
    block,
    chain,
    provider,
    web3,
  );
  balances = formatter.sum([balances, dexBalances]);

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
