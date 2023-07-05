import { createClient } from 'redis';
import { log } from './logger/logger';
import { config } from '../app.config';
const { REDIS_URL } = config;
let client;

function Redis() {
  if (!client && REDIS_URL) {
    try {
      client = createClient({
        url: REDIS_URL,
      });
      client.connect();
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: redis createClient`,
        endpoint: 'redis',
      });
    }
  }

  async function setCache(key, data) {
    try {
      if (client) await client.set(key, JSON.stringify(data));
    } catch (e) {
      log.error({
        message: e?.message || '',
        stack: e?.stack || '',
        detail: `Error: setCache`,
        endpoint: 'setCache',
      });
    }
  }

  async function getCache(key) {
    if (client) return client.get(key);
  }
  return {
    setCache,
    getCache,
  };
}

export default Redis();
