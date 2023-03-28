import BigNumber from 'bignumber.js';
import { request, gql } from 'graphql-request';
import { ITvlParams, ITvlReturn } from '../../../../interfaces/ITvl';
import formatter from '../../../../util/formatter';

const START_BLOCK = 1568116;

const THEGRAPTH_ENDPOINT =
  'https://youves-mainnet-indexer.prod.gke.papers.tech/v1/graphql';

const TZBTC_XTZ_POOL_ADDRESS = 'KT1TxqZ8QtKvLu3V3JH7Gx58n7Co8pgtpQU5';
const TZBTC_ADDRESS = 'KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn';
const USDT_ADDRESS = 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o';

const ENGINES = [
  {
    engineAddress: 'KT1FFE2LC5JpVakVjHm5mM36QVp2p3ZzH4hH',
    token: 'xtz',
  },
  {
    engineAddress: 'KT1DHndgk8ah1MLfciDnCV2zPJrVbnnAH9fd',
    token: 'xtz',
  },
  {
    engineAddress: 'KT1JmfujyCYTw5krfu9bSn7YbLYuz2VbNaje',
    token: USDT_ADDRESS,
  },
  {
    engineAddress: 'KT1V9Rsc4ES3eeQTr4gEfJmNhVbeHrAZmMgC',
    token: TZBTC_ADDRESS,
  },
  {
    engineAddress: 'KT1HxgqnVjGy7KsSUTEsQ6LgpD5iKSGu7QpA',
    token: TZBTC_ADDRESS,
  },
  {
    engineAddress: 'KT1FzcHaNhmpdYPNTgfb8frYXx7B5pvVyowu',
    token: TZBTC_XTZ_POOL_ADDRESS,
  },
  {
    engineAddress: 'KT1F1JMgh6SfqBCK6T6o7ggRTdeTLw91KKks',
    token: TZBTC_XTZ_POOL_ADDRESS,
  },
  {
    engineAddress: 'KT1LQcsXGpmLXnwrfftuQdCLNvLRLUAuNPCV',
    token: 'xtz',
  },
  {
    engineAddress: 'KT1E45AvpSr7Basw2bee3g8ri2LK2C2SV2XG',
    token: TZBTC_XTZ_POOL_ADDRESS,
  },
  {
    engineAddress: 'KT1VjQoL5QvyZtm9m1voQKNTNcQLi5QiGsRZ',
    token: 'xtz',
  },
  {
    engineAddress: 'KT1CP1C8afHqdNfBsSE3ggQhzM2iMHd4cRyt',
    token: 'xtz',
  },
  {
    engineAddress: 'KT1NFWUqr9xNvVsz2LXCPef1eRcexJz5Q2MH',
    token: TZBTC_XTZ_POOL_ADDRESS,
  },
  {
    engineAddress: 'KT1G6RzVX25YnoU55Xb7Vve3zvuZKmouf24a',
    token: TZBTC_XTZ_POOL_ADDRESS,
  },
];

const DEXES = [
  'KT1UJBvm4hv11Uvu6r4c8zE5K2EfmwiRVgsm',
  'KT1JeWiS8j1kic4PHx7aTnEr9p4xVtJNzk5b',
  'KT1T974a8qau4xP3RAAWPYCZM9xtwU9FLjPS',
  'KT1XvH5f2ja2jzdDbv6rxPmecZFU7s3obquN',
  'KT1AVbWyM8E7DptyBCu4B5J5B7Nswkq7Skc6',
  'KT1Xbx9pykNd38zag4yZvnmdSNBknmCETvQV',
];

const QUERY = gql`
  query getVaultAggregates($engineAddress: String!) {
    vault_aggregate(
      where: { engine_contract_address: { _eq: $engineAddress } }
    ) {
      aggregate {
        sum {
          balance
        }
      }
    }
  }
`;

async function getEnginesTvl(block, web3) {
  const balances = {};

  const tzbtcXtzPool = new web3.eth.Contract(null, TZBTC_XTZ_POOL_ADDRESS);
  await tzbtcXtzPool.init();
  const [xtzPool, tokenPool, lqtTotal] = await Promise.all([
    tzbtcXtzPool.methods.xtzPool().call(null, block),
    tzbtcXtzPool.methods.tokenPool().call(null, block),
    tzbtcXtzPool.methods.lqtTotal().call(null, block),
  ]);

  for (const engine of ENGINES) {
    const balance = await request(THEGRAPTH_ENDPOINT, QUERY, {
      engineAddress: engine.engineAddress,
    }).then((data) => data.vault_aggregate.aggregate.sum.balance);

    if (engine.token === TZBTC_XTZ_POOL_ADDRESS) {
      console.log(xtzPool);
      console.log(lqtTotal);
      balances['xtz'] = BigNumber(balances['xtz'] || 0).plus(
        (balance * xtzPool) / lqtTotal,
      );
      balances[TZBTC_ADDRESS] = BigNumber(balances[TZBTC_ADDRESS] || 0).plus(
        (balance * tokenPool) / lqtTotal,
      );
    } else {
      balances[engine.token] = BigNumber(balances[engine.token] || 0).plus(
        balance,
      );
    }
  }

  return balances;
}

async function tvl(params: ITvlParams): Promise<Partial<ITvlReturn>> {
  const { block, chain, provider, web3 } = params;
  if (block < START_BLOCK) {
    return {};
  }

  const balances = await getEnginesTvl(block, web3);

  for (const dex of DEXES) {
    const tokenBalances = await web3.eth.getAllTokensBalances(dex, block);
    formatter.sumMultiBalanceOf(balances, tokenBalances, chain, provider);
  }

  formatter.convertBalancesToFixed(balances);
  return { balances };
}

export { tvl };
