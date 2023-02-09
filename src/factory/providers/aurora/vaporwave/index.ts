import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import fetch from 'node-fetch';

const API = 'https://api.vaporwave.farm/tvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 54501517) {
    return {};
  }

  const balances = {};

  const pools = await fetch(API).then((res) =>
    res.json().then((res) => Object.values(res)[0]),
  );
  for (const pool in pools) {
    if (pools[pool]) {
      balances['0x4988a896b1227218e4a686fde5eabdcabd91571f'] = BigNumber(
        balances['0x4988a896b1227218e4a686fde5eabdcabd91571f'] || 0,
      ).plus(BigNumber(pools[pool]).shiftedBy(6));
    }
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
