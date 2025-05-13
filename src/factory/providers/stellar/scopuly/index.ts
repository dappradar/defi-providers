import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import fetch from 'node-fetch';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const balances = {};

  try {
    // Direct API call to get TVL data
    const response = await fetch(
      'https://api.scopuly.com/api/liquidity_pools_tvl',
    ).then((res) => res.json());

    // Sort by time descending to get most recent entry
    response.sort((a, b) => b.time - a.time);

    // Get most recent TVL entry
    const mostRecentTvl = response[0];

    // Return as USDC balance with 7 decimal places
    const tvlWithDecimals = mostRecentTvl.tvl * 10000000; // Add 7 decimal places
    balances['usdc-ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn'] =
      tvlWithDecimals.toString();
  } catch (error) {
    console.error('Error fetching Scopuly TVL data:', error);
  }

  return { balances };
}

export { tvl };
