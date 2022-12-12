import fetch from 'node-fetch';
import basicUtil from '../../../../util/basicUtil';
import formatter from '../../../../util/formatter';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';

const poolsApiUri = 'https://app.stackswap.org/api/v1/pools';
const START_BLOCK = 33556;

async function getPools(chain, provider) {
  let pools = [];
  let apiPools = [];

  try {
    pools = require('./pools.json');
  } catch {}

  const poolsLength = pools.length;

  try {
    apiPools = await fetch(poolsApiUri).then((res) => res.json());
    apiPools.forEach((apiPool) => {
      if (!pools.includes(apiPool.liquidity_token_addr)) {
        pools.push(apiPool.liquidity_token_addr);
      }
    });
  } catch {}

  if (poolsLength < pools.length) {
    await basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);
  }

  return pools;
}

async function calculate(pools, block, balances, web3) {
  for (const pool of pools) {
    const accountBalances = await web3.eth.getAccountBalances(pool, block);
    web3.eth.extractBalances(accountBalances, balances);
  }
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = {};
  const pools = await getPools(chain, provider);
  await calculate(pools, block, balances, web3);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
