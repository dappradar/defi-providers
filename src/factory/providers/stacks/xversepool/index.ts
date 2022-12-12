import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 33556;
const API_URL = 'https://api.xverse.app/v1/pool/stacking-data/USD';

async function calculate(balances) {
  const totalStxLocked = await fetch(API_URL).then((res) =>
    res.json().then((res) => res.poolStxLocked.totalStxLocked),
  );

  balances['stx'] = BigNumber(totalStxLocked).shiftedBy(6).toFixed();
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};
  await calculate(balances);
  return { balances };
}

export { tvl };
