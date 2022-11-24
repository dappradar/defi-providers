import { resolve } from 'path';

const {
  HOST = '127.0.0.1',
  PORT = 3002,
  DEFI_PROVIDERS_SERVICE_URI = process.env.DEFI_PROVIDERS_SERVICE_URI
    ? process.env.DEFI_PROVIDERS_SERVICE_URI
    : 'localhost:3002',
} = process.env;

const appConifg = {
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
};

export { appConifg };
