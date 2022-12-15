import fetch from 'node-fetch';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const API =
  'https://api.internal.instadapp.io/defi/api/stats/instadapp/overall';
const HISTORICAL_API = 'https://api.llama.fi/updatedProtocol/instadapp';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, date, provider, web3 } = params;
  if (block < 11161291) {
    return {};
  }

  const balances = {};

  if (date == new Date(Date.now()).toISOString().slice(0, 10)) {
    balances['coingecko_tether'] = await fetch(API)
      .then((res) => res.json())
      .then((res) => res.stats[0].totalSupplied);
  } else {
    const result = await fetch(HISTORICAL_API)
      .then((res) => res.json())
      .then((res) => res.tvl);
    const timestamp = new Date(date).getTime() / 1000;
    balances['coingecko_tether'] = result
      .map((data) => ({
        offset: Math.abs(data.date - timestamp),
        totalLiquidityUSD: data.totalLiquidityUSD,
      }))
      .sort((a, b) => a.offset - b.offset)[0].totalLiquidityUSD;
  }
  return { balances };
}

export { tvl };
