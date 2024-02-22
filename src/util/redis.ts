import { createClient } from 'redis';
import { log } from './logger/logger';
import { config } from '../app.config';
const { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } = config;
let client;

function Redis() {
  if (!client && REDIS_HOST) {
    client = createClient({
      url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`,
    });
    client.connect();
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
    if (client) {
      log.info({
        message: `Getting data for ${key}`,
        endpoint: 'getCache',
      });
      return client.get(key);
    }
  }
  return {
    setCache,
    getCache,
  };
}

export default Redis();
