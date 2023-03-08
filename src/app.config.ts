import { resolve } from 'path';
import * as dotenv from 'dotenv';
import * as process from 'process';
dotenv.config();
dotenv.config({ path: `.env.${process.env.APP_ENV || 'dev'}`, override: true });

const {
  HOST = '127.0.0.1',
  PORT = 3002,
  APP_ENV,
  SLACK_WEBHOOK_URL,
  SLACK_LOGGING,
  LOGSTASH_PORT,
  LOGSTASH_HOST,
  LOGSTASH_INDEX,
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
  BASE_URL = './blockchainCache/',
} = process.env;

const config = {
  HOST,
  PORT,
  APP_ENV,
  DEFI_PROVIDERS_SERVICE_PACKAGE: 'dappradar.defi.providers',
  DEFI_PROVIDERS_SERVICE_PROTOFILE: resolve(
    __dirname,
    '..',
    'proto',
    'defi-providers.proto',
  ),
  LOGSTASH_HOST,
  LOGSTASH_PORT,
  LOGSTASH_INDEX,
  SLACK_WEBHOOK_URL,
  SLACK_LOGGING,
  BASE_URL,
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
