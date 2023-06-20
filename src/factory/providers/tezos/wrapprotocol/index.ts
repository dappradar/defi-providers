import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const WRAPPED_TOKENS_ADDRESS = 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ';
const FARM_ADDRESS = 'KT1R9oaqirDaC81UUR3JSQtJfpkFimMVuoLA';
let pools = {};

async function getBalances(address, block, web3) {
  try {
    const contract = new web3.eth.Contract(null, address);
    await contract.init();

    if (!pools[address]) {
      const settings = await contract.methods.settings().call();
      const tokenData = settings.staked_token;
      const keys = Object.keys(tokenData);
      pools[address] =
        typeof tokenData[keys[0]] == 'string'
          ? tokenData[keys[0]]
          : tokenData[keys[1]];
    }

    const result = await contract.methods.ledger().call(null, block);
    return {
      token: pools[address],
      balance: BigNumber(result.total_supply),
    };
  } catch {}
  return null;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1440136) {
    return {};
  }
  const balances = {};
  const contract = new web3.eth.Contract(null, WRAPPED_TOKENS_ADDRESS);
  await contract.init();
  const results = await contract.methods
    .getBigmap('token_total_supply')
    .call(null, block);

  results.forEach((result, index) => {
    if (result) {
      balances[`${WRAPPED_TOKENS_ADDRESS}_${index}`] = BigNumber(result.value);
    } else {
    }
  });

  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  const farmContract = new web3.eth.Contract(null, FARM_ADDRESS);
  await farmContract.init();

  const farms = await farmContract.methods.getBigmap('farms').call(null, block);

  const farmLength = farms.length;
  console.log(`farm length: ${farmLength}`);

  for (let first = 0; first < farmLength; first += 50) {
    const last = Math.min(farmLength, first + 50);
    const reserveCalls = [];
    for (let start = first; start < last; start++) {
      reserveCalls.push(getBalances(farms[start].key, block, web3));
    }

    console.log(`Getting staked balance from ${first} to ${last}`);

    const results = await Promise.all(reserveCalls);
    formatter.sumMultiBalanceOf(balances, results, chain, provider);
    console.log(`Got staked balance from ${first} to ${last}`);
  }
  await basicUtil.savedIntoCache(pools, 'cache/pools.json', chain, provider);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
