import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import BigNumber from 'bignumber.js';
import fetch from 'node-fetch';
import cosmosDex from '../../../../util/calculators/cosmosDex';

const DINJ_ADDRESS = 'inj17glv5mk2pvhpwkdjljacmr2fx9pfc3djepy6xh';
const INJ_ADDRESS = 'inj';
const STATE_METHOD = 'state';
const POOLS_API_URL = 'https://analytics.dojo.trading/dashboard/pools/tvl';
const FACTORY_ADDRESS = 'inj1pc2vxcmnyzawnwkf03n2ggvt997avtuwagqngk';

interface Pool {
  stakingAddress: string;
  vault: {
    config: {
      staking_token: string;
    };
  };
}

async function getPoolBalances(pools: Pool[], web3) {
  let balances = {};

  for (const pool of Object.values(pools)) {
    const MARKET_ADDRESS = pool.stakingAddress;
    const CW20_TOKEN_ADDRESSES = [pool.vault.config.staking_token];

    const marketCw20TokenBalances = await web3.eth.getAccountCw20TokenBalances(
      MARKET_ADDRESS,
      CW20_TOKEN_ADDRESSES,
    );

    balances = formatter.sum([balances, marketCw20TokenBalances]);
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  const pools = await fetch(POOLS_API_URL).then((res) => res.json());
  let balances = await getPoolBalances(pools, web3);

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

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
