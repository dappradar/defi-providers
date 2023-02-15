import 'dotenv/config.js';
import { getLogger, configure } from 'log4js';
const logger = getLogger();

interface ILogger {
  info: ({ message, endpoint }) => void;
  warning: ({ message, stack, detail, endpoint }) => void;
  error: ({ message, stack, detail, endpoint }) => void;
}

configure({
  appenders: {
    console: { type: 'console' },
    logstash: {
      type: `${__dirname}/appenders/logstashAppender`,
    },
    slack: { type: `${__dirname}/appenders/slackAppender` },
    _everything: {
      type: 'logLevelFilter',
      appender: 'everything',
      level: 'all',
    },
    _errors: { type: 'logLevelFilter', appender: 'errors', level: 'error' },
    _slackError: { type: 'logLevelFilter', appender: 'slack', level: 'error' },
    _logstash: { type: 'logLevelFilter', appender: 'logstash', level: 'info' },
  },
  categories: {
    default: {
      appenders: [
        'console',
        '_everything',
        '_errors',
        '_slackError',
        '_logstash',
      ],
      level: 'all',
    },
    expressLogger: { appenders: ['expressLogger'], level: 'debug' },
  },
});

class Logger {
  info(message) {
    logger.info(message);
  }

  warning(message) {
    logger.warn(message);
  }

  error(message) {
    logger.error(message);
  }
}
const log: ILogger = new Logger();
export { log };
