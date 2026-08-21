import { sendMessageToChannel } from "services/slack";

export default class SendNewUserSlackMessage {
  constructor(user) {
    this.user = user;
    this.channel = this.getChannel();
  }

  async perform() {
    const message = this.#generateMessage();
    sendMessageToChannel(message, this.channel)
  }

  getChannel() {
    if (process.env.NODE_ENV !== 'production') return '#notifications-dev';
    if (this.user.plan === 'free') return '#notifications-acquisition';

    return '#notifications';
  }

  getOrigin() {
    if (this.user.plan === 'institutional') return 'desde una institución';
    if (this.user.plan === 'free') return 'desde una cuenta de pruebas';
  }

  #generateMessage() {
    return `
      Nuevo usuario creado ${this.getOrigin()}

      Nombres: ${this.user.firstName}
      Apellidos: ${this.user.lastName}
      Email: ${this.user.email}
      ${this.user.phoneNumber ? `Número: ${this.user.phoneNumber}` : 'Sin número'}
      ${this.user.reference ? `Referencia: ${this.user.reference}` : ''}
      ${this.user.institutionName ? `Institución: ${this.user.institutionName}` : ''}
      ID: ${this.user.id}
    `;
  }
}