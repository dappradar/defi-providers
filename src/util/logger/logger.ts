import 'dotenv/config.js';
import { getLogger, configure } from 'log4js';
const logger = getLogger();
const logs_path = `./logs`;

interface ILogger {
  info: ({ message, endpoint }) => void;
  warning: ({ message, stack, detail, endpoint }) => void;
  error: ({ message, stack, detail, endpoint }) => void;
}

configure({
  appenders: {
    console: { type: 'console' },
    everything: {
      type: 'file',
      filename: `${logs_path}/logs.log`,
      maxLogSize: 1000000,
      backups: 4,
      compress: false,
    },
    errors: {
      type: 'file',
      filename: `${logs_path}/errors.log`,
      maxLogSize: 1000000,
      backups: 4,
      compress: false,
    },
    expressLogger: {
      type: 'file',
      filename: `${logs_path}/express.log`,
      maxLogSize: 500000,
      backups: 10,
      compress: false,
    },
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
