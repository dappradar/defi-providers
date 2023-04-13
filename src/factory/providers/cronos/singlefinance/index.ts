import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import axios from 'axios';
import formatter from '../../../../util/formatter';
import BigNumber from 'bignumber.js';

const START_BLOCK = 2100000;
const SINGLE_VAULT = 'https://api.singlefinance.io/api/vaults?chainid=25';

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;

  if (block < START_BLOCK) {
    return { balances: {} };
  }
  const balances = {};
  const { data } = (
    await axios.get(SINGLE_VAULT, {
      headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
    })
  ).data;

  data.forEach((poolDetail) => {
    balances[poolDetail.token.id.toLowerCase()] = BigNumber(
      balances[poolDetail.token.id] || 0,
    ).plus(poolDetail.totalTokens);
  });

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
