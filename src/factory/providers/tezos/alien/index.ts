import BigNumber from 'bignumber.js';
import chainWeb3 from '../../../../web3Provider/chainWeb3';
import formatter from '../../../../util/formatter';

const FARMS = [
  'KT1WfbRVLuJUEizo6FSTFq5tsi3rsUHLY7vg',
  'KT1JTbVbs4iCjYiBqeNBHqHkAztaTvB6qgJK',
  'KT1BcSP2rE7bHpouNzWBb3MfNVZFcdaRWPta',
  'KT1EiG7Xo1JTd3Q4kGnmM6eYqXW1EaYk4wZW',
];

const AMM_FARMS = [
  'KT1M3a9PaWfBNTYibToVqZ3DChuk1x9Torwr',
  'KT1Uoj71GA7oBbXHqnZTZmHQRCDuyaDs4zDR',
  'KT1H8k3hKQ1FyhbXkxg13ihTJXHB6uEWvzmP',
  'KT1UDwFmuyAbCCC6YSJvNVQPwNGjW91W2HDf',
  'KT1Lm2C7TsRi4EMQj2sxpr3iD1jpck1MXXSY',
  'KT1UcYH3CLtKL393rHEEkFphWjZNzeHtLEXB',
  'KT1D5VoidRrC4G2HDXpSUfAVaccGpzWJsE3r',
];

async function farmBalance(address, block, chain) {
  const web3 = chainWeb3.getWeb3(chain);

  const contract = new web3.eth.Contract(null, address);
  await contract.init();

  const [total_staked, pool_address] = await Promise.all([
    contract.methods.total_staked().call(null, block),
    contract.methods.pool_address().call(null, block),
  ]);

  const pool = new web3.eth.Contract(null, pool_address);
  await pool.init();

  const storage = await pool.methods.storage().call(null, block);

  let token = storage.token_address;
  if (
    [
      'KT193D4vozYnhGJQVtw7CoxxqphqUEEwK6Vb',
      'KT1XPFjZqCULSnqfKaaYy8hJjeY63UNSGwXg',
    ].includes(token)
  ) {
    token = `${token}_0`;
  }

  const balance = BigNumber(total_staked)
    .div(storage.total_supply)
    .times(storage.token_pool);
  // .times(2);
  return {
    token,
    balance,
  };
}

async function ammFarmBalance(address, block, chain) {
  const web3 = chainWeb3.getWeb3(chain);

  const contract = new web3.eth.Contract(null, address);
  await contract.init();

  const [total_staked, pool_address, token_id] = await Promise.all([
    contract.methods.total_staked().call(null, block),
    contract.methods.pool_address().call(null, block),
    contract.methods.token_id().call(null, block),
  ]);

  const pool = new web3.eth.Contract(null, pool_address);
  await pool.init();

  const pairs = await pool.methods.getBigmap('pairs').call(null, block);
  const pair = pairs.find((pair) => pair.key == token_id);

  const token_pool = [
    'KT1Uoj71GA7oBbXHqnZTZmHQRCDuyaDs4zDR',
    'KT1D5VoidRrC4G2HDXpSUfAVaccGpzWJsE3r',
  ].includes(address)
    ? pair.value.token_a_pool
    : pair.value.token_b_pool;

  const token =
    address === 'KT1H8k3hKQ1FyhbXkxg13ihTJXHB6uEWvzmP'
      ? 'KT1XPFjZqCULSnqfKaaYy8hJjeY63UNSGwXg_0'
      : 'KT19DUSZw7mfeEATrbWVPHRrWNVbNnmfFAE6';

  const balance = BigNumber(token_pool)
    .times(total_staked)
    .div(1e24)
    .div(BigNumber(pair.value.total_supply).div(1e6)); // total_supply

  return {
    token,
    balance,
  };
}

async function tvl(params) {
  const { block, chain } = params;

  if (block < 1565538) {
    return {};
  }

  console.log('Calculation Started');
  const balances = {};
  const web3 = chainWeb3.getWeb3(chain);

  const c = new web3.eth.Contract(null, 'KT1DMCGGiHT2dgjjXHG7qh1C1maFchrLNphx');
  await c.init();
  const [paulToken, paulStaked] = await Promise.all([
    c.methods.coin_address().call(null, block),
    c.methods.total_staked().call(null, block),
  ]);
  balances[paulToken] = paulStaked;
  // farms

  console.log('Calculating for farms');
  const farmBalances = await Promise.all(
    FARMS.map((farm) => farmBalance(farm, block, chain)),
  );

  console.log('Calculating for amms');
  const ammFarmBalances = await Promise.all(
    AMM_FARMS.map((farm) => ammFarmBalance(farm, block, chain)),
  );

  formatter.sumMultiBalanceOf(balances, farmBalances);
  formatter.sumMultiBalanceOf(balances, ammFarmBalances);
  formatter.convertBalancesToFixed(balances);

  return { balances };
}

export { tvl };
