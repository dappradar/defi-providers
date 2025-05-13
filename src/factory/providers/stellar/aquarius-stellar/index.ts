import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import fetch from 'node-fetch';
import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';

const AQUA_NETWORK_API =
  'https://amm-api.aqua.network/pools/?pool_type=&sort=-liquidity&page=1&size=100';

function processPoolsData(pools: any[], balances: { [key: string]: string }) {
  for (const pool of pools) {
    if (
      pool.tokens_str &&
      Array.isArray(pool.tokens_str) &&
      pool.reserves &&
      Array.isArray(pool.reserves) &&
      pool.tokens_str.length === pool.reserves.length
    ) {
      for (let i = 0; i < pool.tokens_str.length; i++) {
        const tokenStr = pool.tokens_str[i];
        const reserve = pool.reserves[i];

        const assetKey = formatter.formatStellarAddresses(tokenStr);

        const formattedAmount = reserve.split('.')[0];

        balances[assetKey] = BigNumber(balances[assetKey] || 0)
          .plus(new BigNumber(formattedAmount))
          .toString();
      }
    }
  }
  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { chain, provider } = params;

  const balances = {};

  try {
    console.log('Fetching pool data from Aqua Network API...');
    const response = await fetch(AQUA_NETWORK_API).then((res) => res.json());

    if (response.items && Array.isArray(response.items)) {
      console.log(`Processing ${response.items.length} pools...`);

      // Cache the API response for fallback
      const cache = { poolData: response };
      await basicUtil.saveIntoCache(
        cache,
        'aqua-network-pools.json',
        chain,
        provider,
      );

      processPoolsData(response.items, balances);
    }
  } catch (error) {
    console.error('Error fetching data from Aqua Network API:', error);

    // Fallback to cached pool data
    try {
      console.log('Falling back to cached pool data...');
      const cache = await basicUtil.readFromCache(
        'aqua-network-pools.json',
        chain,
        provider,
      );

      if (cache.poolData && cache.poolData.items) {
        console.log(`Using ${cache.poolData.items.length} cached pools`);

        processPoolsData(cache.poolData.items, balances);
      }
    } catch (cacheError) {
      console.error('No cached pool data available:', cacheError);
    }
  }

  formatter.mapStellarTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
