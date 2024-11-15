import BigNumber from 'bignumber.js';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import fetch from 'node-fetch';
import { log } from '../../../../util/logger/logger';

const API = 'https://api.makerburn.com/status';
const DAI = {
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  decimals: 18,
};
const USDS = {
  address: '0xdc035d45d973e3ec169d2276ddab16f1e407384f',
  decimals: 18,
};
const MKR = {
  address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  decimals: 18,
};
const USDC = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  decimals: 6,
};

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const balances = {};

  try {
    const response = await fetch(API);
    const data = await response.json();
    balances[USDC.address] = BigNumber(data.dai_total)
      .plus(data.usds_token_total_supply)
      .shiftedBy(USDC.decimals);
    balances[DAI.address] = BigNumber(data.dai_in_dsr).shiftedBy(DAI.decimals);
    balances[USDS.address] = BigNumber(data.usds_in_ssr)
      .plus(data.usds_stake_amount)
      .shiftedBy(USDS.decimals);
    balances[MKR.address] = BigNumber(data.mkr_in_pause_proxy)
      .plus(data.mkr_burned)
      .dividedBy(data.mkr_price)
      .shiftedBy(MKR.decimals);
  } catch (e) {
    log.error({
      message: e?.message || '',
      stack: e?.stack || '',
      detail: `Error: tvl of ethereum/sky`,
      endpoint: 'tvl',
    });
  }
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
