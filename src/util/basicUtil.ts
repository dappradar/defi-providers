import fse from 'fs-extra';
import { WMAIN_ADDRESS } from '../constants/contracts.json';
import data from './data';
import { log } from './logger/logger';
import { config } from '../app.config';
import Redis from './redis';
const DEFAULT_DELAY = 0;

function basicUtil() {
  function getPath(chain, provider) {
    return `${config.BASE_URL}${chain}/${provider}`;
  }

  function getWmainAddress(chain) {
    return WMAIN_ADDRESS[chain];
  }

  function getDelay(chain) {
    return /*data.CHAINS[chain]?.delay ||*/ DEFAULT_DELAY;
  }

  async function saveIntoCache(data, fileName, chain, provider) {
    /*await new Promise<void>(function (resolve) {
      fse.outputFile(
        `${getPath(chain, provider)}/${fileName}`,
        JSON.stringify(data, null, 2),
        'utf8',
        function (err) {
          if (err) {
            log.error({
              message: err?.message || '',
              stack: err?.stack || '',
              detail: `Error: saveIntoCache`,
              endpoint: 'saveIntoCache',
            });
          }
          resolve();
        },
      );
    });*/
    await Redis.setCache(`${chain}_${provider}_${fileName}`, data);
  }

  async function readFromCache(fileName, chain, provider) {
    const cachedDate = await Redis.getCache(`${chain}_${provider}_${fileName}`);
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
    saveIntoCache: saveIntoCache,
    readFromCache: readFromCache,
    checkZeroBalance: checkZeroBalance,
  };
}

export default basicUtil();
