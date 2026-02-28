import { sendMessageToChannel } from "services/slack";

const roleTranslate = {
  'parent': 'Padre',
  'teacher': 'Educadora',
}
export default class SendAddRoleToUserSlackMessage {
  constructor(user) {
    this.user = user;
    this.channel = this.getChannel();
    this.role = roleTranslate[user.role];
  }

  async perform() {
    const message = this.#generateMessage();
    sendMessageToChannel(message, this.channel)
  }

  getChannel() {
    if (process.env.NODE_ENV !== 'production') return '#notifications-dev';
    if (this.user.plan === 'trial') return '#notifications-acquisition';

    return '#notifications';
  }

  #generateMessage() {
    return `
      ${this.user.firstName} ${this.user.lastName} eligió el rol de ${this.role}.
    `;
  }
}