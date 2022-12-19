import * as dgram from 'dgram';
import { config } from '../app.config';
import { Logger } from '@nestjs/common';

const client = dgram.createSocket('udp4');

function sendLog({
  message = null,
  stack = null,
  detail = null,
  endpoint,
  level = 'Error',
}) {
  const { LOGSTASH_INDEX, LOGSTASH_PORT, LOGSTASH_HOST } = config;
  const logMessage = {
    '@timestamp': new Date().toISOString(),
    '@metadata': {
      package: LOGSTASH_INDEX,
    },
    message,
    stack,
    detail,
    endpoint,
    level,
  };
  Logger.log(JSON.stringify(logMessage));
  if (LOGSTASH_HOST && LOGSTASH_PORT) {
    client.send(
      JSON.stringify(logMessage),
      Number(LOGSTASH_PORT),
      LOGSTASH_HOST,
    );
  }
}

export { sendLog };
