import * as dgram from 'dgram';
import { Injectable } from '@nestjs/common';
import { config } from '../app.config';
const client = dgram.createSocket('udp4');

@Injectable()
export class Logger {
  sendLog({ Message = '', Stack = '', Detail = '', Endpoint, Level }) {
    const message = {
      '@timestamp': new Date().toISOString(),
      '@metadata': {
        package: config.LOGSTASH_INDEX,
      },
      Message,
      Stack,
      Detail,
      Endpoint,
      Level,
    };
    client.send(
      JSON.stringify(message),
      Number(config.LOGSTASH_PORT),
      config.LOGSTASH_HOST,
    );
  }
}
