import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const FACTORY_ADDRESSES = [
  'KT1UnRsTyHVGADQWDgvENL3e9i6RMnTVfmia',
  'KT1JW8AeCbvshGkyrsyu1cWa5Vt7GSpNKrUz',
];

async function getReserve(address, block, web3) {
  try {
    const contract = new web3.eth.Contract(null, address);
    await contract.init();
    const token = await contract.methods.tokenAddress().call();
    const tokenBalance = await contract.methods.tokenPool().call(null, block);
    const xtzBalance = await contract.methods.xtzPool().call(null, block);
    let tokenId;
    try {
      tokenId = await contract.methods.tokenId().call();
    } catch {}
    return [
      {
        token: 'xtz',
        balance: BigNumber(xtzBalance),
      },
      {
        token: tokenId ? `${token}_${tokenId}` : token,
        balance: BigNumber(tokenBalance),
      },
    ];
  } catch {}
  return null;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1730490) {
    return {};
  }

  let pools = {};
  try {
    pools = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  let allPools = [];
  for (const factory of FACTORY_ADDRESSES) {
    pools[factory] = pools[factory] || [];
    const poolLength = pools[factory].length;

    const contract = new web3.eth.Contract(null, factory);
    await contract.init();

    const counter = await contract.methods.counter().call(null, block);

    if (poolLength < counter) {
      const swaps = await contract.methods.getBigmap('swaps').call(null, block);
      pools[factory] = swaps.map((swap) => swap.value);
    }

    allPools = allPools.concat(pools[factory].slice(0, counter));
  }
  await basicUtil.writeDataToFile(pools, 'cache/pools.json', chain, provider);
  const balances = {};
  const allPoolLength = allPools.length;
  console.log(`Total Pool length: ${allPoolLength}`);

  for (let first = 0; first < allPoolLength; first += 50) {
    const last = Math.min(allPoolLength, first + 50);
    const reserveCalls = [];
    for (let start = first; start < last; start++) {
      reserveCalls.push(getReserve(allPools[start], block, web3));
    }
    console.log(`Getting reserves from ${first} to ${last}`);
    const results = await Promise.all(reserveCalls);
    results.forEach((result) => {
      formatter.sumMultiBalanceOf(balances, result);
    });
    console.log(`Got reserves from ${first} to ${last}`);
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
