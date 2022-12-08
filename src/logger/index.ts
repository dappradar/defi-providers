'use strict';

import * as dotenv from 'dotenv';
dotenv.config();
import log4js from 'log4js';
const index = log4js.getLogger();
const appenders_path = `${__dirname}/appenders`;

const config = {
  appenders: {
    console: { type: 'console' },
    slack: { type: `${appenders_path}/slackAppender` },
    logstash: { type: `${appenders_path}/logstashAppender` },
    _slackError: {
      type: 'logLevelFilter',
      appender: 'slack',
      level: 'info',
    },
    _logstash: {
      type: 'logLevelFilter',
      appender: 'logstash',
      level: 'info',
    },
  },
  categories: {
    default: {
      appenders: ['console', '_logstash', '_slackError'],
      level: 'all',
    },
  },
};

log4js.configure(config);

function info(message) {
  index.info(message);
}

function warning(message) {
  index.warn(message);
}

function error(message) {
  index.error(message);
}

export { info, warning, error };
