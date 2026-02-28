import { WebClient } from '@slack/web-api';

const web = new WebClient(process.env.SLACK_BOT_TOKEN);

export const sendMessageToChannel = async (message, channel) => {
  try {
    await web.chat.postMessage({
      channel,
      text: message,
    });
  } catch (error) {
    console.error(error);
  }
}
