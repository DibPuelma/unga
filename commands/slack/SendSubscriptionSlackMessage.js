import { sendMessageToChannel } from "services/slack";

const EVENT_MESSAGES = {
  new: '🎉 Nueva suscripción Unga',
  cancelled: '😢 Suscripción cancelada',
  payment_failed: '⚠️ Falló el cobro de una suscripción',
};

export default class SendSubscriptionSlackMessage {
  constructor({ user, event, amount, detail }) {
    this.user = user;
    this.event = event;
    this.amount = amount;
    this.detail = detail;
  }

  async perform() {
    try {
      sendMessageToChannel(this.#generateMessage(), this.#getChannel());
    } catch (e) {
      console.error('Slack notification failed:', e);
    }
  }

  #getChannel() {
    if (process.env.NODE_ENV !== 'production') return '#notifications-dev';
    return '#notifications-acquisition';
  }

  #generateMessage() {
    const lines = [
      EVENT_MESSAGES[this.event] || this.event,
      `Usuario: ${this.user?.firstName || ''} ${this.user?.lastName || ''} (${this.user?.email || 'sin email'})`,
    ];
    if (this.amount) lines.push(`Monto: $${this.amount.toLocaleString('es-CL')} CLP`);
    if (this.detail) lines.push(this.detail);
    return lines.join('\n');
  }
}
