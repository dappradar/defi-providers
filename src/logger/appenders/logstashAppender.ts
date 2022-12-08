import * as dotenv from 'dotenv';
dotenv.config();
import dgram from 'dgram';
const client = dgram.createSocket('udp4');
import os from 'os';

const isTooLong = (query) =>
  JSON.stringify(query).length > 10000 ? 'Too long' : query;

const generatePayload = (loggingEvent) => {
  const message = loggingEvent.data[0];
  const data = {
    '@timestamp': new Date().toISOString(),
    '@metadata': {
      package: process.env.LOGSTASH_INDEX,
    },
    host: os.hostname(),
    level: loggingEvent.level.levelStr,
  };

  if ('object' === typeof message && Array.isArray(message)) {
    return {
      ...data,
      messageArray: isTooLong(JSON.stringify(message)),
    };
  } else if ('object' === typeof message && !Array.isArray(message)) {
    const result = { ...data };
    for (const key of Object.keys(message)) {
      const messageValue = message[key];
      if (!String(messageValue).match(/\\$/)) {
        result[key] = isTooLong(
          'string' === typeof messageValue
            ? messageValue
            : JSON.stringify(messageValue),
        );
      }
    }
    return result;
  }

  return {
    ...data,
    messageText: isTooLong(message),
  };
};

function sendMessage(messageBody) {
  return new Promise((resolve, reject) => {
    client.send(
      messageBody,
      parseInt(process.env.LOGSTASH_PORT),
      process.env.LOGSTASH_HOST,
      (err) => {
        if (err) {
          console.log('err to debug', err);
          reject(err);
        } else {
          resolve(messageBody);
        }
      },
    );
  });
}

const send = async (loggingEvent) => {
  try {
    const payload = JSON.stringify(generatePayload(loggingEvent));
    await sendMessage(payload);
  } catch (e) {
    console.error(e);
  }
};

const logstashAppender = (layout, timezoneOffset) => (loggingEvent) =>
  send(loggingEvent);

const configure = (config, layouts) => {
  let layout = layouts.colouredLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return logstashAppender(layout, config.timezoneOffset);
};

exports.configure = configure;
