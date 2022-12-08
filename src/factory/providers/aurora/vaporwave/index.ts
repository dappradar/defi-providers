import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const API = 'https://api.vaporwave.farm/tvl';
const HISTORICAL_API = 'https://api.llama.fi/updatedProtocol/vaporwave';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, date } = params;

  if (block < 54501517) {
    return {};
  }

  const balances = {};

  if (date == new Date(Date.now()).toISOString().slice(0, 10)) {
    const pools = await fetch(API).then((res) =>
      res.json().then((res) => Object.values(res)[0]),
    );
    for (const pool in pools) {
      if (pools[pool]) {
        balances['coingecko_tether'] = BigNumber(
          balances['coingecko_tether'] || 0,
        ).plus(BigNumber(pools[pool]));
      }
    }
  } else {
    const result = await fetch(HISTORICAL_API)
      .then((res) => res.json())
      .then((res) => res.chainTvls.Aurora.tvl);
    const timestamp = new Date(date).getTime() / 1000;
    balances['coingecko_tether'] = result
      .map((data) => ({
        offset: Math.abs(data.date - timestamp),
        totalLiquidityUSD: data.totalLiquidityUSD,
      }))
      .sort((a, b) => a.offset - b.offset)[0].totalLiquidityUSD;
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
