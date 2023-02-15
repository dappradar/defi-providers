import BigNumber from 'bignumber.js';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';
import { log } from '../../../../util/logger/logger';

const YOUVES_ADDRESS = 'KT1Xobej4mc6XgEjDoJoHtTKgbD1ELMvcQuL';
const UTOKEN_ADDRESS = 'KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW';
const VAULT_CREATOR = 'KT1FFE2LC5JpVakVjHm5mM36QVp2p3ZzH4hH';
const ORACLE_ADDRESS = 'KT1P8Ep9y8EsDSD9YkvakWnDvF2orDcpYXSq';
const POOLS = [
  'KT1Lz5S39TMHEA7izhQn8Z1mQoddm6v1jTwH',
  'KT1TFPn4ZTzmXDzikScBrWnHkoqTA7MBt9Gi',
  'KT1TMfRfmJ5mkJEXZGRCsqLHn2rgnV1SdUzb',
  'KT1Kvg5eJVuYfTC1bU1bwWyn4e1PRGKAf6sy',
  'KT1M8asPmVQhFG6yujzttGonznkghocEkbFk',
  'KT19bkpis4NSDnt6efuh65vYxMaMHBoKoLEw',
  'KT1KNbtEBKumoZoyp5uq6A4v3ETN7boJ9ArF',
];

async function getBalances(address, block, web3) {
  try {
    const contract = new web3.eth.Contract(null, address);
    await contract.init();

    const totalStake = await contract.methods.total_stake().call(null, block);

    return {
      token: POOLS[address],
      balance: BigNumber(totalStake),
    };
  } catch {}
  return null;
}

async function getTezosUusdBalances(address, block, web3) {
  try {
    const tezosBalance = await web3.eth.getBalance(address, block);

    return [
      {
        token: 'xtz',
        balance: tezosBalance,
      },
    ];
  } catch {}
  return null;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < 1568116) {
    return {};
  }

  const balances = {};

  const uusdContract = new web3.eth.Contract(null, UTOKEN_ADDRESS);
  await uusdContract.init();
  const totalSupplies = await uusdContract.methods
    .getBigmap('total_supply')
    .call(null, block);

  let uDefiPrice;
  try {
    const oracleContract = new web3.eth.Contract(null, ORACLE_ADDRESS);
    await oracleContract.init();
    uDefiPrice = await oracleContract.methods
      .valid_defi_price()
      .call(null, block);
  } catch {}

  totalSupplies.forEach((result) => {
    try {
      if (result.key == 1 && uDefiPrice) {
        balances['coingecko_usd-coin'] = BigNumber(result.value)
          .times(uDefiPrice)
          .div(1e18)
          .toFixed();
      } else if (result.key == 2) {
        balances['coingecko_bitcoin'] = BigNumber(result.value)
          .div(1e12)
          .toFixed();
      } else {
        balances[`${UTOKEN_ADDRESS}_${result.key}`] = result.value;
      }
    } catch {
      balances[`${UTOKEN_ADDRESS}_${result.key}`] = result.value;
    }
  });

  const vaultCreator = new web3.eth.Contract(null, VAULT_CREATOR);
  await vaultCreator.init();
  const vaults = await vaultCreator.methods
    .getBigmap('vault_lookup')
    .call(null, block);

  const vaultLength = vaults.length;
  for (let first = 0; first < vaultLength; first += 50) {
    const last = Math.min(vaultLength, first + 50);
    const balanceCalls = [];
    for (let start = first; start < last; start++) {
      balanceCalls.push(getTezosUusdBalances(vaults[start].key, block, web3));
    }

    log.info({
      message: `Getting tezos balance from ${first} to ${last}`,
      endpoint: 'tvl of tezos/youves',
    });

    const results = await Promise.all(balanceCalls);
    results.forEach((result) => {
      if (result) {
        formatter.sumMultiBalanceOf(balances, result, chain, provider);
      }
    });
  }

  const youvesContract = new web3.eth.Contract(null, YOUVES_ADDRESS);
  await youvesContract.init();
  const balance = await youvesContract.methods.total_stake().call(null, block);
  balances[YOUVES_ADDRESS] = BigNumber(balance).div(1e6);

  const poolLength = POOLS.length;
  for (let first = 0; first < poolLength; first += 50) {
    const last = Math.min(poolLength, first + 50);
    const balanceCalls = [];
    for (let start = first; start < last; start++) {
      balanceCalls.push(getBalances(POOLS[start], block, web3));
    }

    log.info({
      message: `Getting staked balance from ${first} to ${last}`,
      endpoint: 'tvl of tezos/youves',
    });
    const results = await Promise.all(balanceCalls);
    formatter.sumMultiBalanceOf(balances, results, chain, provider);
  }
  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
