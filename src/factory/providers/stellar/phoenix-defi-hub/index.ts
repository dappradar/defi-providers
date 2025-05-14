import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import fetch from 'node-fetch';
import basicUtil from '../../../../util/basicUtil';

const PHOENIX_API_ENDPOINT =
  'https://api-phoenix-v2.decentrio.ventures/tickers';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3, chain, provider } = params;

  const balances = {};
  let pools: string[] = [];

  try {
    console.log('Fetching Phoenix DeFi Hub pools...');
    const response = await fetch(PHOENIX_API_ENDPOINT).then((res) =>
      res.json(),
    );

    if (Array.isArray(response)) {
      pools = response
        .filter((item) => item.pool_id)
        .map((item) => item.pool_id);

      console.log(`Found ${pools.length} Phoenix DeFi Hub pools`);

      // Cache the pools for fallback
      const cache = { pools, rawData: response };
      await basicUtil.saveIntoCache(
        cache,
        'phoenix-defi-hub-pools.json',
        chain,
        provider,
      );
    }
  } catch (error) {
    console.error('Error fetching data from Phoenix DeFi Hub API:', error);

    // Fallback to cached pools
    try {
      console.log('Falling back to cached pool data...');
      const cache = await basicUtil.readFromCache(
        'phoenix-defi-hub-pools.json',
        chain,
        provider,
      );

      if (cache.pools && Array.isArray(cache.pools)) {
        pools = cache.pools;
        console.log(`Using ${pools.length} cached pools`);
      }
    } catch (cacheError) {
      console.error('No cached pool data available:', cacheError);
    }
  }

  if (pools.length > 0) {
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < pools.length; i += batchSize) {
      batches.push(pools.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      console.log(`Processing batch of ${batch.length} pools...`);
      const tokenBalances = await web3.eth.getContractsBalances(batch);

      formatter.sumMultiBalanceOf(balances, tokenBalances);

      if (batches.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  formatter.mapStellarTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
