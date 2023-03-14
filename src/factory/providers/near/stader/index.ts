import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';

const STADER_API = 'https://staderverse.staderlabs.com/tvl';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3, date } = params;

  const balances = {};

  if (date == new Date(Date.now()).toISOString().slice(0, 10)) {
    const tvls = await axios.get(STADER_API);
    balances['near'] = BigNumber(tvls.data.near.native).shiftedBy(24).toFixed();
  }

  return { balances };
}

export { tvl };
