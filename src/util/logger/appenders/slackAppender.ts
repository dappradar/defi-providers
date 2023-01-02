import https from 'https';
import os from 'os';
import { config } from '../../../app.config';

const { APP_ENV, SLACK_WEBHOOK_URL, SLACK_LOGGING } = config;
interface ILoggingEvent {
  level: {
    levelStr: string;
  };
  data: IMessage;
}
interface IMessage {
  message: string;
  stack: string;
  detail: string;
  endpoint: string;
  level: string;
}
function generatePayload(loggingEvent: ILoggingEvent) {
  const attachments = [
    {
      color: '#800000',
      fields: [
        {
          title: 'Environment',
          value: APP_ENV,
          short: true,
        },
        {
          title: 'Machine',
          value: os.hostname(),
          short: true,
        },
      ],
    },
  ];

  const payload = {
    text: JSON.stringify(loggingEvent.data, null, 2),
    attachments: attachments,
  };

  return payload;
}

async function send(loggingEvent: ILoggingEvent) {
  if (!SLACK_WEBHOOK_URL) {
    throw new Error('Please fill in your Webhook URL');
  }

  try {
    const payload = JSON.stringify(generatePayload(loggingEvent));
    await sendSlackMessage(payload);
  } catch (e) {
    console.error(e);
    throw new Error(
      `SLACK WARNING: There was a error with the slack request when try to send: ${JSON.stringify(
        loggingEvent,
      )} `,
      e,
    );
  }
}

function sendSlackMessage(messageBody) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(SLACK_WEBHOOK_URL, requestOptions, (res) => {
      let response = '';
      res.on('data', (d) => (response += d));
      res.on('end', () => resolve(response));
    });

    req.on('error', (e) => reject(e));

    req.write(messageBody);
    req.end();
  });
}

function slackAppender(layout, timezoneOffset) {
  return (loggingEvent) => {
    if (SLACK_LOGGING == 'true') send(loggingEvent);
  };
}
function configure(config, layouts, findAppender, levels) {
  let layout = layouts.colouredLayout;
  if (config.layout) {
    layout = layouts.layout(config.layout.type, config.layout);
  }
  return slackAppender(layout, config.timezoneOffset);
}

export { configure };
