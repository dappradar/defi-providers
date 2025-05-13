import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import fetch from 'node-fetch';
import basicUtil from '../../../../util/basicUtil';

const DUNE_API_ENDPOINT =
  'https://api.dune.com/api/v1/query/4341139/results?limit=100';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3, chain, provider } = params;

  const balances = {};
  let pools: string[] = [];

  try {
    console.log('Fetching Soroswap pools from Dune Analytics API...');
    const response = await fetch(DUNE_API_ENDPOINT, {
      headers: {
        'X-Dune-API-Key': process.env.DUNE_API_KEY,
      },
    }).then((res) => res.json());

    if (
      response.result &&
      response.result.rows &&
      Array.isArray(response.result.rows)
    ) {
      pools = response.result.rows
        .filter((row) => row.pool)
        .map((row) => row.pool);

      console.log(`Found ${pools.length} Soroswap pools`);

      // Cache the pools for fallback
      const cache = { pools };
      await basicUtil.saveIntoCache(
        cache,
        'soroswap-pools.json',
        chain,
        provider,
      );
    }
  } catch (error) {
    console.error('Error fetching data from Dune Analytics API:', error);

    // Fallback to cached pools
    try {
      console.log('Falling back to cached pool data...');
      const cache = await basicUtil.readFromCache(
        'soroswap-pools.json',
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
      const tokenBalances = await web3.eth.getAddressesBalances(batch);

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
