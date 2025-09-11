import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlReturn } from '../../../../interfaces/ITvl';
import fetch from 'node-fetch';
import { log } from '../../../../util/logger/logger';

async function tvl(): Promise<Partial<ITvlReturn>> {
  const balances = {};

  try {
    const pryzmApiEndpoint = 'https://api.pryzm.zone';
    const hostChainId = 'inj';

    const [supplyResponse, hostChainStateResponse] = await Promise.all([
      fetch(
        `${pryzmApiEndpoint}/cosmos/bank/v1beta1/supply/by_denom?denom=c:${hostChainId}`,
      ),
      fetch(
        `${pryzmApiEndpoint}/pryzm/icstaking/v1/host_chain_state/${hostChainId}`,
      ),
    ]);

    const supplyData = await supplyResponse.json();
    const hostChainStateData = await hostChainStateResponse.json();

    const cTokenSupply = supplyData.amount?.amount;
    const exchangeRate = hostChainStateData.host_chain_state?.exchange_rate;

    if (!cTokenSupply || !exchangeRate) {
      log.error({
        message: 'Missing data from Pryzm API',
        detail: `cTokenSupply: ${cTokenSupply}, exchange_rate: ${exchangeRate}`,
        endpoint: 'tvl',
      });
      return { balances };
    }

    const amount = Number(cTokenSupply);
    const totalValue = amount * Number(exchangeRate);

    balances['inj'] = BigNumber(totalValue).toFixed();

    formatter.convertBalancesToFixed(balances);
    return { balances };
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of injective/pryzm`,
      endpoint: 'tvl',
    });
    return { balances };
  }
}

export { tvl };
