import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlReturn } from '../../../../interfaces/ITvl';
import fetch from 'node-fetch';
import { log } from '../../../../util/logger/logger';

async function tvl(): Promise<Partial<ITvlReturn>> {
  const balances = {};

  try {
    const hostZoneUrl =
      'https://stride-walk-214t-api.polkachu.com//Stride-Labs/stride/stakeibc/host_zone/injective-1';

    const [supplyResponse, hostZoneResponse] = await Promise.all([
      fetch(
        'https://stride-walk-214t-api.polkachu.com//cosmos/bank/v1beta1/supply/by_denom?denom=stinj',
      ),
      fetch(hostZoneUrl),
    ]);

    const supplyData = await supplyResponse.json();
    const hostZoneData = await hostZoneResponse.json();

    const assetBalance = supplyData.amount?.amount;
    const hostZone = hostZoneData.host_zone;

    if (!assetBalance || !hostZone?.redemption_rate) {
      log.error({
        message: 'Missing data from Stride API',
        detail: `assetBalance: ${assetBalance}, redemption_rate: ${hostZone?.redemption_rate}`,
        endpoint: 'tvl',
      });
      return { balances };
    }

    const amount = Number(assetBalance);
    const totalValue = amount * Number(hostZone.redemption_rate);

    balances['inj'] = BigNumber(totalValue).toFixed();

    formatter.convertBalancesToFixed(balances);
    return { balances };
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of injective/stride`,
      endpoint: 'tvl',
    });
    return { balances };
  }
}

export { tvl };
