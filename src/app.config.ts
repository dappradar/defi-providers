import { resolve } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: `.env.${process.env.APP_ENV || 'dev'}`, override: true });

const {
  HOST = process.env.HOST || '127.0.0.1',
  PORT = process.env.HOST || 3002,
  APP_ENV = process.env.APP_ENV,
  SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL,
  SLACK_LOGGING = process.env.SLACK_LOGGING,
  LOGSTASH_PORT = process.env.LOGSTASH_PORT,
  LOGSTASH_HOST = process.env.LOGSTASH_HOST,
  LOGSTASH_INDEX = process.env.LOGSTASH_INDEX,
  OPTIMISM_NODE_URL = process.env.OPTIMISM_NODE_URL,
  ETHEREUM_NODE_URL = process.env.ETHEREUM_NODE_URL,
  BSC_NODE_URL = process.env.BSC_NODE_URL,
  AURORA_NODE_URL = process.env.AURORA_NODE_URL,
  AVALANCHE_NODE_URL = process.env.AVALANCHE_NODE_URL,
  CELO_NODE_URL = process.env.CELO_NODE_URL,
  EVERSCALE_NODE_URL = process.env.EVERSCALE_NODE_URL,
  FANTOM_NODE_URL = process.env.FANTOM_NODE_URL,
  HEDERA_NODE_URL = process.env.HEDERA_NODE_URL,
  MOONBEAM_NODE_URL = process.env.MOONBEAM_NODE_URL,
  MOONRIVER_NODE_URL = process.env.MOONRIVER_NODE_URL,
  NEAR_NODE_URL = process.env.NEAR_NODE_URL,
  POLYGON_NODE_URL = process.env.POLYGON_NODE_URL,
  RONIN_NODE_URL = process.env.RONIN_NODE_URL,
  SOLANA_NODE_URL = process.env.SOLANA_NODE_URL,
  STACKS_NODE_URL = process.env.STACKS_NODE_URL,
  TEZOS_NODE_URL = process.env.TEZOS_NODE_URL,
} = process.env;

const config = {
  HOST,
  PORT,
  APP_ENV,
  DEFI_PROVIDERS_SERVICE_PACKAGE: 'dappradar.defi.providers',
  DEFI_PROVIDERS_SERVICE_PROTOFILE: resolve(
    __dirname,
    '..',
    'dappradar-proto',
    'defi-providers.proto',
  ),
  LOGSTASH_HOST,
  LOGSTASH_PORT,
  LOGSTASH_INDEX,
  SLACK_WEBHOOK_URL,
  SLACK_LOGGING,
};

const nodeUrls = {
  OPTIMISM_NODE_URL,
  ETHEREUM_NODE_URL,
  BSC_NODE_URL,
  AURORA_NODE_URL,
  AVALANCHE_NODE_URL,
  CELO_NODE_URL,
  EVERSCALE_NODE_URL,
  FANTOM_NODE_URL,
  HEDERA_NODE_URL,
  MOONBEAM_NODE_URL,
  MOONRIVER_NODE_URL,
  NEAR_NODE_URL,
  POLYGON_NODE_URL,
  RONIN_NODE_URL,
  SOLANA_NODE_URL,
  STACKS_NODE_URL,
  TEZOS_NODE_URL,
};

export { config, nodeUrls };
