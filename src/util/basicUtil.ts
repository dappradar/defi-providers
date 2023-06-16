import fse from 'fs-extra';
import { WMAIN_ADDRESS } from '../constants/contracts.json';
import data from './data';
import { log } from './logger/logger';
import { config } from '../app.config';
import { createClient } from 'redis';
const DEFAULT_DELAY = 20;
let client;

async function redisInit() {
  if (!client) {
    console.log('init redis');
    client = createClient({
      url: 'redis://defi-providers-redis-01.qa.aws.dappradar.ns:6379',
    });
    await client.connect();
  }
}

function basicUtil() {
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
    await redisInit();
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
    try {
      await client.set(
        `${chain}_${provider}_${fileName}`,
        JSON.stringify(data),
      );
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: writeDataToFile`,
        endpoint: 'writeDataToFile',
      });
    }
  }

  async function readDataFromFile(fileName, chain, provider) {
    let cachedDate;
    try {
      cachedDate = await client.set(
        `${chain}_${provider}_${fileName}`,
        JSON.stringify(data),
      );
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: readDataFromFile`,
        endpoint: 'readDataFromFile',
      });
    }
    if (cachedDate) {
      return JSON.parse(cachedDate);
    }
    return JSON.parse(
      fse.readFileSync(`${getPath(chain, provider)}/${fileName}`, 'utf8'),
    );
  }

  function checkZeroBalance(balances: { [key: string]: string }) {
    if (balances) {
      Object.entries(balances).forEach(([key, value]) => {
        if (Number(value) == 0) {
          delete balances[key];
        }
      });
    }
    return balances;
  }

  return {
    getWmainAddress: getWmainAddress,
    getDelay: getDelay,
    writeDataToFile: writeDataToFile,
    readDataFromFile: readDataFromFile,
    checkZeroBalance: checkZeroBalance,
  };
}

export default basicUtil();
