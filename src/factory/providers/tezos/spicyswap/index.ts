import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import basicUtil from '../../../../util/basicUtil';

const ROUTER_ADDRESS = 'KT1PwoZxyv4XkPEGnTqWYvjA1UYiPTgAGyqL';

async function getReserves(address, tokens, block, web3) {
  try {
    const contract = new web3.eth.Contract(null, address);
    await contract.init();
    const reserve0 = await contract.methods.reserve0().call(null, block);
    const reserve1 = await contract.methods.reserve1().call(null, block);

    return [
      {
        token: tokens.token0,
        balance: BigNumber(reserve0),
      },
      {
        token: tokens.token1,
        balance: BigNumber(reserve1),
      },
    ];
  } catch {}
  return [];
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1765238) {
    return {};
  }
  const contract = new web3.eth.Contract(null, ROUTER_ADDRESS);
  await contract.init();

  let pairs = {};
  try {
    pairs = basicUtil.readDataFromFile('cache/pools.json', chain, provider);
  } catch {}

  const results = await contract.methods.getBigmap('pairs').call(null, block);
  results.forEach((result) => {
    if (!pairs[result.value.contract]) {
      try {
        const token0 = result.value.token0;
        const token1 = result.value.token1;
        pairs[result.value.contract] = {
          token0: token0.token_id
            ? `${token0.fa2_address}_${token0.token_id}`
            : token0.fa2_address,
          token1: token1.token_id
            ? `${token1.fa2_address}_${token1.token_id}`
            : token1.fa2_address,
        };
      } catch {}
    }
  });

  const pairAddresses = Object.keys(pairs);
  const pairLength = pairAddresses.length;
  console.log(`farm length: ${pairLength}`);
  const balances = {};

  for (let first = 0; first < pairLength; first += 50) {
    const last = Math.min(pairLength, first + 50);
    const reserveCalls = [];
    for (let start = first; start < last; start++) {
      reserveCalls.push(
        getReserves(
          pairAddresses[start],
          pairs[pairAddresses[start]],
          block,
          web3,
        ),
      );
    }
    console.log(`Getting reserves from ${first} to ${last}`);
    const results = await Promise.all(reserveCalls);
    results.forEach((result) => {
      formatter.sumMultiBalanceOf(balances, result, chain, provider);
    });
    console.log(`Got reserves from ${first} to ${last}`);
  }
  await basicUtil.writeDataToFile(pairs, 'cache/pairs.json', chain, provider);
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
