import { resolve } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const {
  HOST = '127.0.0.1',
  PORT = 3002,
  DEFI_PROVIDERS_SERVICE_URI = process.env.DEFI_PROVIDERS_SERVICE_URI
    ? process.env.DEFI_PROVIDERS_SERVICE_URI
    : 'localhost:3002',
  LOGSTASH_PORT = process.env.LOGSTASH_PORT || 9999,
  LOGSTASH_HOST = process.env.LOGSTASH_HOST || 'logstash-01.pr.do.dappradar.ns',
  LOGSTASH_INDEX = process.env.LOGSTASH_INDEX || 'defi-tracker',
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
  DEFI_PROVIDERS_SERVICE_PACKAGE: 'dappradar.defi.providers',
  DEFI_PROVIDERS_SERVICE_PROTOFILE: resolve(
    __dirname,
    '..',
    'dappradar-proto',
    'defi-providers.proto',
  ),
  DEFI_PROVIDERS_SERVICE_URI,
  GRPC_DEFI_PROVIDERS_SERVICE: 'GRPC_DEFI_PROVIDERS_SERVICE',
  LOGSTASH_HOST,
  LOGSTASH_PORT,
  LOGSTASH_INDEX,
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
