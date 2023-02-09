import fse from 'fs-extra';
import { WMAIN_ADDRESS } from '../constants/contracts.json';
import CHAINS from './data';
import { log } from './logger/logger';

const DEFAULT_DELAY = 5;

function getPath(chain, provider) {
  return `./blockchainCache/${chain}/${provider}`;
}

function getWmainAddress(chain) {
  return WMAIN_ADDRESS[chain];
}

function getDelay(chain) {
  return CHAINS[chain].delay || DEFAULT_DELAY;
}

async function writeDataToFile(data, fileName, chain, provider) {
  await new Promise<void>(function (resolve) {
    fse.outputFile(
      `${getPath(chain, provider)}/${fileName}`,
      JSON.stringify(data, null, 2),
      'utf8',
      function (err) {
        if (err) {
          log.error({
            message: err?.message || '',
            stack: err?.stack || '',
            detail: `Error: writeDataToFile`,
            endpoint: 'writeDataToFile',
          });
        }
        resolve();
      },
    );
  });
}

function readDataFromFile(fileName, chain, provider) {
  return JSON.parse(
    fse.readFileSync(`${getPath(chain, provider)}/${fileName}`, 'utf8'),
  );
}

export default {
  getPath,
  getWmainAddress,
  getDelay,
  writeDataToFile,
  readDataFromFile,
};
