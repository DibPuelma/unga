import WhatsApp from 'whatsapp';

// Your test sender phone number


export default class WhatsappService {
  constructor(recipientNumber) {
    this.wa = new WhatsApp(process.env.WA_PHONE_NUMBER_ID);
    this.recipientNumber = recipientNumber;
  }

  async sendRawMessage(body) {
    try {
      const sentTextMessage = this.wa.messages.text({ body }, this.recipientNumber);

      const response = await sentTextMessage
      console.log(response.rawResponse());
    }
    catch (e) {
      console.log(JSON.stringify(e));
    }
  }
}