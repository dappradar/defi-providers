import fse from 'fs-extra';
import { WMAIN_ADDRESS } from '../constants/contracts.json';
import data from './data';
import { log } from './logger/logger';
import { config } from '../app.config';
const DEFAULT_DELAY = 5;

function getPath(chain, provider) {
  return `${config.BASE_URL}${chain}/${provider}`;
}

function getWmainAddress(chain) {
  return WMAIN_ADDRESS[chain];
}

function getDelay(chain) {
  return data.CHAINS[chain].delay || DEFAULT_DELAY;
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
  console.log(`${getPath(chain, provider)}/${fileName}`);
  return JSON.parse(
    fse.readFileSync(`${getPath(chain, provider)}/${fileName}`, 'utf8'),
  );
}

function checkZeroBalance(balances: { [key: string]: string }) {
  Object.entries(balances).forEach(([key, value]) => {
    if (Number(value) == 0) {
      delete balances[key];
    }
  });
  return balances;
}

export default {
  checkZeroBalance,
  getPath,
  getWmainAddress,
  getDelay,
  writeDataToFile,
  readDataFromFile,
};
