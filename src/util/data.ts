//import fs from 'fs';
import { nodeUrls } from '../app.config';

const data = {
  CHAINS: {
    ethereum: {
      prefix: '',
      chainID: 'ethereum',
      coingecko: 'ethereum',
    },
    bsc: {
      prefix: 'bsc_',
      chainID: 'bsc',
      coingecko: 'binance-smart-chain',
      start: '2020-08-30',
    },
    aurora: {
      prefix: 'aur_',
      chainID: 'aurora',
      coingecko: 'aurora',
      start: '2021-10-15',
    },
    avalanche: {
      prefix: 'ava_',
      chainID: 'avalanche',
      coingecko: 'avalanche',
      start: '2020-09-23',
    },
    celo: {
      prefix: 'celo_',
      chainID: 'celo',
      coingecko: 'celo',
      start: '2020-04-22',
      delay: 100,
    },
    everscale: {
      prefix: 'ever_',
      chainID: 'everscale',
      coingecko: '',
      start: '2020-05-07',
    },
    fantom: {
      prefix: 'ftm_',
      chainID: 'fantom',
      coingecko: 'fantom',
    },
    hedera: {
      prefix: 'hbar_',
      chainID: 'hedera',
      coingecko: 'hedera',
    },
    moonbeam: {
      prefix: 'glmr_',
      chainID: 'moonbeam',
      coingecko: 'moonbeam',
      start: '2021-12-18',
    },
    moonriver: {
      prefix: 'movr_',
      chainID: 'moonriver',
      coingecko: 'moonriver',
      start: '2021-06-30',
    },
    near: {
      prefix: 'near_',
      chainID: 'near',
      coingecko: 'near-protocol',
      start: '2020-07-22',
      startBlock: 9820210,
    },
    optimism: {
      prefix: 'opt_',
      chainID: 'optimism',
      coingecko: 'optimistic-ethereum',
      start: '2021-11-11',
      delay: 1000,
    },
    polygon: {
      prefix: 'mat_',
      chainID: 'matic',
      coingecko: 'polygon-pos',
      delay: 50,
    },
    ronin: {
      prefix: 'ronin_',
      chainID: 'ronin',
      coingecko: 'ronin',
      start: '2021-01-26',
    },
    solana: {
      prefix: 'sol_',
      chainID: 'solana',
      coingecko: 'solana',
    },
    tezos: {
      prefix: 'tz_',
      chainID: 'tezos',
      coingecko: 'tezos',
    },
    stacks: {
      prefix: 'stx_',
      chainID: 'stacks',
      coingecko: '',
    },
  },
  FILTERS: {
    MarketCapInFiat: 'marketCapInFiat',
    AdjustedTvlInFiat: 'adjustedTvlInFiat',
    TvlInFiat: 'tvlInFiat',
    CapTvl: 'capTvl',
  },
  /*AUTHENTICATION: {
    publicKeyPR: fs.readFileSync(".publicPR.pem"),
    publicKeyQA: fs.readFileSync(".publicQA.pem"),
  },*/
};

Object.keys(data.CHAINS).forEach((chain) => {
  const node_url_name = `${chain.toUpperCase()}_NODE_URL`;
  data[node_url_name] = nodeUrls[node_url_name];
});

export default data;
