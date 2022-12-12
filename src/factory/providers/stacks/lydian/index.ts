import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const START_BLOCK = 51868;
const API_URL = 'https://lydian-api.herokuapp.com/dashboard';

function getValueFromApi(apiResult, blockTimestamp, selector) {
  let result;
  for (let i = 0; i < apiResult[selector].length; i++) {
    if (apiResult[selector][i].timestamp / 1000 > blockTimestamp) {
      result = apiResult[selector][i].value;
      break;
    }
  }
  if (result === undefined) {
    result = apiResult[selector][apiResult[selector].length - 1].value;
  }
  return result;
}

async function calculate(block, balances, web3) {
  const blockTimestamp = await web3.eth
    .getBlock(block)
    .then((res) => res.timestamp);

  const apiResult = await fetch(API_URL).then((res) => res.json());

  const tmv = getValueFromApi(apiResult, blockTimestamp, 'tmv');

  const stakedValue = getValueFromApi(
    apiResult,
    blockTimestamp,
    'staked-value',
  );

  return (balances['coingecko_tether'] = BigNumber(tmv)
    .plus(stakedValue)
    .dp(0)
    .toFixed());
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }
  const balances = {};
  await calculate(block, balances, web3);
  return { balances };
}

export { tvl };
