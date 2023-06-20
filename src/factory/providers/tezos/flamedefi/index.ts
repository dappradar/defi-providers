import fetch from 'node-fetch';
import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

async function getBalance(address, token, block, web3) {
  try {
    const contract = new web3.eth.Contract(null, address);
    await contract.init();
    const balance = await contract.methods.total_stack().call(null, block);
    return {
      token,
      balance: BigNumber(balance),
    };
  } catch {}
  return null;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1501304) {
    return {};
  }

  let pools = {};
  try {
    pools = await basicUtil.readFromCache('cache/pools.json', chain, provider);
  } catch {}

  const result = await fetch('https://api2.spacefarm.xyz/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{
        farms {
          items {
            id
            stakeToken {
              id
            }
          }
        }
      }`,
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data.farms.items);

  result.forEach((item) => {
    const tokenData = item.stakeToken.id.split(':');
    if (tokenData.length > 2) {
      pools[item.id] = `${tokenData[1]}_${tokenData[2]}`;
    } else {
      pools[item.id] = tokenData[1];
    }
  });

  await basicUtil.saveIntoCache(pools, 'cache/pools.json', chain, provider);
  const allPools = Object.keys(pools);

  const balances = {};

  const allPoolLength = allPools.length;
  console.log(`Total Pool length: ${allPoolLength}`);

  for (let first = 0; first < allPoolLength; first += 50) {
    const last = Math.min(allPoolLength, first + 50);
    const reserveCalls = [];
    for (let start = first; start < last; start++) {
      reserveCalls.push(
        getBalance(allPools[start], pools[allPools[start]], block, web3),
      );
    }

    console.log(`Getting stake balance from ${first} to ${last}`);
    const results = await Promise.all(reserveCalls);
    formatter.sumMultiBalanceOf(balances, results, chain, provider);
    console.log(`Got stake balance from ${first} to ${last}`);
  }

  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
