import { sendMessageToChannel } from "services/slack";

export default class SendNewPMFAnswerSlackMessage {
  constructor(answer) {
    this.answer = answer;
    this.channel = process.env.NODE_ENV === 'production' ? '#notifications' : '#notifications-dev';
  }

  async perform() {
    const message = this.#generateMessage();
    sendMessageToChannel(message, this.channel)
  }

  #generateMessage() {
    return `
      Nueva respuesta encuesta PMF

      Nivel de decepción: ${this.answer.dissapointment}
      ¿Por qué?: ${this.answer.why}
      Mejoras: ${this.answer.improvements}
      Usuario: ${this.answer.user}
      
    `;
  }
}