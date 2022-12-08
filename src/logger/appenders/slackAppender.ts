import * as dotenv from 'dotenv';
dotenv.config();
import SlackNotify from 'slack-notify';
const slack = SlackNotify(process.env.SLACK_LOGGING_HOOKURL);

const generatePayload = (loggingEvent) => {
  const data = loggingEvent.data[0];
  return {
    level: loggingEvent.level.level,
    username: 'Defi Tracker Log',
    channel: `#${process.env.SLACK_LOGGING_CHANNEL}`,
    icon_url: 'https://assets.coingecko.com/coins/images/20894/small/radar.png',
    fields: {
      Message: data.Message || '',
      Detail: data.Detail || '',
      Stack: data.Stack || '',
      Endpoint: data.Endpoint || '',
      Timestamp: new Date().toISOString(),
    },
  };
};

const send = async (loggingEvent) => {
  try {
    await sendSlackMessage(generatePayload(loggingEvent));
  } catch (e) {
    console.error(e);
    throw new Error('There was a error with the request', e);
  }
};

function sendSlackMessage(messageBody) {
  if (messageBody.level == 40000 && process.env.SLACK_NOTIFICATION != 'false') {
    return new Promise((resolve, reject) => {
      slack.send(messageBody);
    });
  }
}

const slackAppender = (layout, timezoneOffset) => (loggingEvent) =>
  send(loggingEvent);

const configure = (config, layouts) => {
  // the default layout for the appender
  let layout = layouts.colouredLayout;
  // check if there is another layout specified
  if (config.layout) {
    // load the layout
    layout = layouts.layout(config.layout.type, config.layout);
  }
  //create a new appender instance
  return slackAppender(layout, config.timezoneOffset);
};

//export the only function needed
exports.configure = configure;
