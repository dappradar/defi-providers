//import fs from 'fs';
import { nodeUrls } from '../app.config';

const data = {
  CHAINS: {
    ethereum: {
      prefix: '',
      delay: 800,
    },
    bsc: {
      prefix: 'bsc_',
      delay: 2400,
    },
    aurora: {
      prefix: 'aur_',
      delay: 3600,
    },
    avalanche: {
      prefix: 'ava_',
      delay: 2400,
    },
    celo: {
      prefix: 'celo_',
      delay: 1440,
    },
    everscale: {
      prefix: 'ever_',
      delay: 3600,
    },
    fantom: {
      prefix: 'ftm_',
      delay: 7200,
    },
    hedera: {
      prefix: 'hbar_',
      delay: 1440,
    },
    moonbeam: {
      prefix: 'glmr_',
      delay: 600,
    },
    moonriver: {
      prefix: 'movr_',
      delay: 600,
    },
    near: {
      prefix: 'near_',
      delay: 5000,
    },
    optimism: {
      prefix: 'opt_',
      delay: 3000,
    },
    polygon: {
      prefix: 'mat_',
      delay: 3600,
    },
    ronin: {
      prefix: 'ronin_',
      delay: 2400,
    },
    solana: {
      prefix: 'sol_',
      delay: 5000,
    },
    tezos: {
      prefix: 'tz_',
      delay: 120,
    },
    stacks: {
      prefix: 'stx_',
      delay: 12,
    },
    cronos: {
      prefix: 'cro_',
      delay: 1200,
    },
    arbitrum: {
      prefix: 'arb_',
      delay: 400,
    },
    'zksync-era': {
      prefix: 'zke_',
      delay: 200,
    },
    elysium: {
      prefix: 'lava_',
      delay: 400,
    },
    base: {
      prefix: 'base_',
      delay: 400,
    },
    core: {
      prefix: 'core_',
      delay: 0,
    },
    aptos: {
      prefix: 'apt_',
      delay: 4600,
    },
    ton: {
      prefix: 'ton_',
      delay: 0,
    },
    'skale-europa': {
      prefix: 'skeur_',
      delay: 0,
    },
    etherlink: {
      prefix: 'etherlink_',
      delay: 0,
    },
    unichain: {
      prefix: 'unichain_',
      delay: 0,
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
