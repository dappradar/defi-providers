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

function getPath(sdk) {
  if (sdk.chain === 'ethereum') return `./src/dapps/providers/${sdk.provider}`;
  return `./src/dapps/providers/${sdk.chain}_${sdk.provider}`;
}

function getWmainAddress(sdk) {
  return WMAIN_ADDRESS[sdk.chain];
}

function getDelay(sdk) {
  return CHAINS[sdk.chain].delay || DEFAULT_DELAY;
}

async function writeDataToFile(data, fileName, sdk) {
  await new Promise<void>(function (resolve) {
    fse.outputFile(
      `${getPath(sdk)}/${fileName}`,
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

function readDataFromFile(fileName, sdk) {
  return JSON.parse(fse.readFileSync(`${getPath(sdk)}/${fileName}`, 'utf8'));
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
