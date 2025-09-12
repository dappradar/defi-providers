import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: `.env.${process.env.APP_ENV || 'dev'}` });

const {
  HOST = '127.0.0.1',
  PORT = 3002,
  APP_ENV,
  NODE_ENV,
  SLACK_WEBHOOK_URL,
  SLACK_LOGGING,
  LOGSTASH_PORT,
  LOGSTASH_HOST,
  LOGSTASH_INDEX,
  BASE_URL = './blockchainCache/',
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_PASSWORD,
  SOLANA_BOTTLENECK_MIN_TIME,
} = process.env;

const config = {
  HOST,
  PORT,
  APP_ENV,
  NODE_ENV,
  LOGSTASH_HOST,
  LOGSTASH_PORT,
  LOGSTASH_INDEX,
  SLACK_WEBHOOK_URL,
  SLACK_LOGGING,
  BASE_URL,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_PASSWORD,
  SOLANA_BOTTLENECK_MIN_TIME: Number(SOLANA_BOTTLENECK_MIN_TIME),
};

const nodeUrls: { [key: string]: string } = {};

nodeUrls['OPTIMISM_NODE_URL'] = process.env['OPTIMISM_NODE_URL'];
nodeUrls['ETHEREUM_NODE_URL'] = process.env['ETHEREUM_NODE_URL'];
nodeUrls['BSC_NODE_URL'] = process.env['BSC_NODE_URL'];
nodeUrls['AURORA_NODE_URL'] = process.env['AURORA_NODE_URL'];
nodeUrls['AVALANCHE_NODE_URL'] = process.env['AVALANCHE_NODE_URL'];
nodeUrls['CELO_NODE_URL'] = process.env['CELO_NODE_URL'];
nodeUrls['EVERSCALE_NODE_URL'] = process.env['EVERSCALE_NODE_URL'];
nodeUrls['FANTOM_NODE_URL'] = process.env['FANTOM_NODE_URL'];
nodeUrls['HEDERA_NODE_URL'] = process.env['HEDERA_NODE_URL'];
nodeUrls['MOONBEAM_NODE_URL'] = process.env['MOONBEAM_NODE_URL'];
nodeUrls['MOONRIVER_NODE_URL'] = process.env['MOONRIVER_NODE_URL'];
nodeUrls['NEAR_NODE_URL'] = process.env['NEAR_NODE_URL'];
nodeUrls['POLYGON_NODE_URL'] = process.env['POLYGON_NODE_URL'];
nodeUrls['RONIN_NODE_URL'] = process.env['RONIN_NODE_URL'];
nodeUrls['SOLANA_NODE_URL'] = process.env['SOLANA_NODE_URL'];
nodeUrls['STACKS_NODE_URL'] = process.env['STACKS_NODE_URL'];
nodeUrls['TEZOS_NODE_URL'] = process.env['TEZOS_NODE_URL'];
nodeUrls['CRONOS_NODE_URL'] = process.env['CRONOS_NODE_URL'];
nodeUrls['ARBITRUM_NODE_URL'] = process.env['ARBITRUM_NODE_URL'];
nodeUrls['ZKSYNC-ERA_NODE_URL'] = process.env['ZKSYNC-ERA_NODE_URL'];
nodeUrls['ELYSIUM_NODE_URL'] = process.env['ELYSIUM_NODE_URL'];
nodeUrls['BASE_NODE_URL'] = process.env['BASE_NODE_URL'];
nodeUrls['CORE_NODE_URL'] = process.env['CORE_NODE_URL'];
nodeUrls['LINEA_NODE_URL'] = process.env['LINEA_NODE_URL'];
nodeUrls['WAX_NODE_URL'] = process.env['WAX_NODE_URL'];
nodeUrls['APTOS_NODE_URL'] = process.env['APTOS_NODE_URL'];
nodeUrls['BTTC_NODE_URL'] = process.env['BTTC_NODE_URL'];
nodeUrls['XAI_NODE_URL'] = process.env['XAI_NODE_URL'];
nodeUrls['BAHAMUT_NODE_URL'] = process.env['BAHAMUT_NODE_URL'];
nodeUrls['SKALE-EUROPA_NODE_URL'] = process.env['SKALE-EUROPA_NODE_URL'];
nodeUrls['ETHERLINK_NODE_URL'] = process.env['ETHERLINK_NODE_URL'];
nodeUrls['BLAST_NODE_URL'] = process.env['BLAST_NODE_URL'];
nodeUrls['INJECTIVE_NODE_URL'] = process.env['INJECTIVE_NODE_URL'];
nodeUrls['UNICHAIN_NODE_URL'] = process.env['UNICHAIN_NODE_URL'];
nodeUrls['BOBA-ETH_NODE_URL'] = process.env['BOBA-ETH_NODE_URL'];
nodeUrls['SONEIUM_NODE_URL'] = process.env['SONEIUM_NODE_URL'];
nodeUrls['UNITZERO_NODE_URL'] = process.env['UNITZERO_NODE_URL'];

export { config, nodeUrls };
