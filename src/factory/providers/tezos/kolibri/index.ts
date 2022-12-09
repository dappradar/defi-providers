import formatter from '../../../../util/formatter';

const OVEN_REGISTRY = 'KT1Ldn1XWQmk7J4pYgGFjjwV57Ew8NYvcNtJ';
const QLKUSD = 'KT1AxaBxkFLCUi3f8rdDAAxBKHfzY8LfKDRA';
const KUSD = 'KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV';

async function getTezosBalance(address, block, web3) {
  try {
    const tezosBalance = await web3.eth.getBalance(address, block);

    return {
      token: 'xtz',
      balance: tezosBalance,
    };
  } catch {}
  return null;
}

async function tvl(params) {
  const { block, web3 } = params;

  if (block < 1330057) {
    return {};
  }

  const balances = {};
  try {
    const kusdBalance = await web3.eth.getTokenBalance(KUSD, QLKUSD, block);
    balances[KUSD] = kusdBalance[0].balance;
  } catch {}

  const ovenRegistry = new web3.eth.Contract(null, OVEN_REGISTRY);
  await ovenRegistry.init();
  const ovens = await ovenRegistry.methods
    .getBigmap('ovenMap')
    .call(null, block);

  const pools = ovens.map((oven) => oven.key);

  const poolLength = pools.length;
  for (let first = 0; first < poolLength; first += 50) {
    const last = Math.min(poolLength, first + 50);
    const balanceCalls = [];
    for (let start = first; start < last; start++) {
      balanceCalls.push(getTezosBalance(pools[start], block, web3));
    }

    console.log(`Getting tezos balance from ${first} to ${last}`);

    const results = await Promise.all(balanceCalls);
    formatter.sumMultiBalanceOf(balances, results);

    console.log(`Got tezos balance from ${first} to ${last}`);
  }

  formatter.convertBalancesToFixed(balances);
  console.log(balances);
  return { balances };
}

export { tvl };
