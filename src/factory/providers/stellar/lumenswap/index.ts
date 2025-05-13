import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import fetch from 'node-fetch';
import basicUtil from '../../../../util/basicUtil';
import BigNumber from 'bignumber.js';

const LUMENSWAP_API = 'https://api.lumenswap.io/amm/known-pools';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { web3, chain, provider } = params;

  const balances = {};

  let poolIds: string[] = [];
  try {
    console.log('Fetching pool IDs from Lumenswap API...');
    const response = await fetch(LUMENSWAP_API).then((res) => res.json());
    poolIds = response.map((pool) => pool.poolId);

    // Update cache with latest pool IDs
    const cache = { poolIds };
    await basicUtil.saveIntoCache(
      cache,
      'lumenswap-pools.json',
      chain,
      provider,
    );
    console.log(`Fetched ${poolIds.length} pool IDs from API`);
  } catch (error) {
    console.error('Error fetching pool IDs from Lumenswap API:', error);

    // Fallback to cached pool IDs
    try {
      console.log('Falling back to cached pool IDs...');
      const cache = await basicUtil.readFromCache(
        'lumenswap-pools.json',
        chain,
        provider,
      );
      poolIds = cache.poolIds || [];
      console.log(`Using ${poolIds.length} cached pool IDs`);
    } catch (cacheError) {
      console.error('No cached pool IDs available:', cacheError);
    }
  }

  if (poolIds.length > 0) {
    // Use batches to avoid overloading the API
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < poolIds.length; i += batchSize) {
      batches.push(poolIds.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      console.log(`Processing batch of ${batch.length} pools...`);
      const poolDetails = await web3.eth.getLiquidityPoolsBalances(batch);

      // Extract and add pool reserves to balances
      for (const pool of poolDetails) {
        if (pool && pool.reserves && Array.isArray(pool.reserves)) {
          pool.reserves.forEach((reserve) => {
            if (reserve.asset && reserve.amount) {
              const assetKey = formatter.formatStellarAddresses(reserve.asset);

              balances[assetKey] = BigNumber(balances[assetKey] || 0)
                .plus(BigNumber(reserve.amount))
                .toString();
            }
          });
        }
      }
    }
  }

  formatter.mapStellarTokenAddresses(balances);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
