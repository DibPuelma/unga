import { sendMessageToChannel } from "services/slack";

export default class SendAddedPaymentMethodSlackMessage {
  constructor(userData, seletedPlan) {
    this.userData = userData;
    this.seletedPlan = seletedPlan;
    this.channel = process.env.NODE_ENV === 'production' ? '#notifications' : '#notifications-dev';
  }

  async perform() {
    const message = this.#generateMessage();
    sendMessageToChannel(message, this.channel)
  }

  #generateMessage() {
    return `
      Un usuario ha registrado su tarjeta y empezado su prueba gratuita en el plan ${this.seletedPlan}:

      ID: ${this.userData.id}
      Nombres: ${this.userData.firstName}
      Apellidos: ${this.userData.lastName}
      Email: ${this.userData.email}
      ${this.userData.phoneNumber ? `Número: ${this.userData.phoneNumber}` : 'Sin número'}
    `;
  }
}