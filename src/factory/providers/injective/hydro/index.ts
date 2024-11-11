import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';

const XHDRO_ADDRESS = 'inj1qc2tw477wwuvkad0h3g78xqgwx4k8knat6vz0h';
const HDRO_ADDRESS = 'factory/inj1etz0laas6h7vemg3qtd67jpr6lh8v7xz7gfzqw/hdro';
const HINJ_ADDRESS = 'inj18luqttqyckgpddndh8hvaq25d5nfwjc78m56lc';
const HYDRO_AUTOCOMPOUND_ADDRESS = 'inj1mjcg8a73904rj4w7t5qkgn0apua98n059nufma';
const INJ_ADDRESS = 'inj';
const TOKEN_INFO_METHOD = 'token_info';
const STATE_METHOD = 'state';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  const balances = {};

  balances[HDRO_ADDRESS] = await web3.eth
    .call(XHDRO_ADDRESS, TOKEN_INFO_METHOD)
    .then((data) => data.total_supply);
  balances[INJ_ADDRESS] = await web3.eth
    .call(HINJ_ADDRESS, TOKEN_INFO_METHOD)
    .then((data) => data.total_supply);
  balances[INJ_ADDRESS] = new BigNumber(balances[INJ_ADDRESS] || 0).plus(
    await web3.eth
      .call(HYDRO_AUTOCOMPOUND_ADDRESS, STATE_METHOD)
      .then((data) => data.total_bonded),
  );

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
