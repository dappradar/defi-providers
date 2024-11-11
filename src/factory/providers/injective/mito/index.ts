import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import fetch from 'node-fetch';
import { log } from '../../../../util/logger/logger';

const API =
  'https://sentry.exchange.grpc-web.injective.network/api/exchange/portfolio/v2/portfolio/inj1vcqkkvqs7prqu70dpddfj7kqeqfdz5gg662qs3/balances';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const balances = {};

  try {
    const response = await fetch(API);
    const data = await response.json();

    data.portfolio.subaccounts.forEach((subaccount) => {
      const denom = subaccount.denom;
      const availableBalance = new BigNumber(
        subaccount.deposit.availableBalance,
      );
      balances[denom] = new BigNumber(balances[denom] || 0).plus(
        availableBalance,
      );
    });

    formatter.convertBalancesToFixed(balances);
    return { balances };
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of injecctive/mito`,
      endpoint: 'tvl',
    });
    return { balances };
  }
}

export { tvl };
