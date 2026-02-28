import { sendMessageToChannel } from "services/slack";

export default class SendUserSawTrialEndedSlackMessage {
  constructor(userData) {
    this.userData = userData;
    this.channel = process.env.NODE_ENV === 'production' ? '#notifications-acquisition' : '#notifications-dev';
  }

  async perform() {
    const message = this.#generateMessage();
    sendMessageToChannel(message, this.channel)
  }

  #generateMessage() {
    return `
      Un usuario entró a la página de que se le terminó el trial

      ID: ${this.userData.id}
      Nombres: ${this.userData.firstName}
      Apellidos: ${this.userData.lastName}
      Email: ${this.userData.email}
      ${this.userData.phoneNumber ? `Número: ${this.userData.phoneNumber}` : 'Sin número'}
      ${this.userData.institutionName ? `Institución: ${this.userData.institutionName}` : ''}
    `;
  }
}