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

const nodeUrls = { OPTIMISM_NODE_URL };

export { config, nodeUrls };
