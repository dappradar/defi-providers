/*==================================================
  Modules
  ==================================================*/

import fse from 'fs-extra';
import { WMAIN_ADDRESS } from '../constants/contracts.json';
import CHAINS from '../data';

/*==================================================
  Settings
  ==================================================*/

const DEFAULT_DELAY = 5;

/*==================================================
  Helper Methods
  ==================================================*/

function getPath(chain, provider) {
  if (chain === 'ethereum') return `./src/dapps/providers/${provider}`;
  return `./src/dapps/providers/${chain}_${provider}`;
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
          console.error(err);
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

/*==================================================
  Exports
  ==================================================*/

export default {
  getPath,
  getWmainAddress,
  getDelay,
  writeDataToFile,
  readDataFromFile,
};
