import { TransactionDetail } from 'transbank-sdk';
import { getInscriptionInstance, getMallTransactionInstance, getTransbankConfig } from './config';

// Transbank hard limits (SDK ApiConstants).
const MAX_USERNAME_LENGTH = 40;
const MAX_TBK_USER_LENGTH = 40;
export const MAX_BUY_ORDER_LENGTH = 26;

const RESPONSE_CODE_MESSAGES = {
  '-1': 'La transacción fue rechazada. Inténtalo de nuevo o usa otra tarjeta.',
  '-2': 'La transacción fue rechazada. Verifica los datos de tu tarjeta.',
  '-3': 'Hubo un error en la transacción. Intenta registrar tu tarjeta nuevamente.',
  '-4': 'La transacción fue rechazada por tu banco.',
  '-5': 'La transacción fue rechazada por riesgo de fraude.',
  '-96': 'La tarjeta registrada ya no es válida. Regístrala nuevamente.',
  '-97': 'Se superó el límite de transacciones. Inténtalo más tarde.',
  '-98': 'Se superó el monto máximo permitido.',
  '-99': 'La transacción fue rechazada. Inténtalo de nuevo.',
};

export const getResponseCodeMessage = (code) =>
  RESPONSE_CODE_MESSAGES[String(code)] || 'La transacción fue rechazada. Inténtalo de nuevo.';

const truncate = (value, max) => (value || '').slice(0, max);

export const startInscription = async (email, responseUrl) => {
  const inscription = getInscriptionInstance();
  const username = truncate(email, MAX_USERNAME_LENGTH);
  const response = await inscription.start(username, email, responseUrl);
  return { token: response.token, url: response.url_webpay };
};

export const finishInscription = async (token) => {
  const inscription = getInscriptionInstance();
  const response = await inscription.finish(token);
  return {
    responseCode: response.response_code,
    tbkUser: response.tbk_user,
    authorizationCode: response.authorization_code,
    cardType: response.card_type,
    cardNumber: response.card_number,
  };
};

export const removeInscription = async (tbkUser, email) => {
  const inscription = getInscriptionInstance();
  const username = truncate(email, MAX_USERNAME_LENGTH);
  return inscription.remove(tbkUser, username);
};

// username MUST be the exact email used at inscription time.
export const authorizeCharge = async ({ username, tbkUser, buyOrder, amount }) => {
  if (!tbkUser || tbkUser.length > MAX_TBK_USER_LENGTH) {
    throw new Error('Invalid tbkUser: card must be re-registered');
  }
  if (buyOrder.length > MAX_BUY_ORDER_LENGTH) {
    throw new Error(`buyOrder exceeds ${MAX_BUY_ORDER_LENGTH} chars`);
  }

  const config = getTransbankConfig();
  const transaction = getMallTransactionInstance();
  const details = [
    new TransactionDetail(
      Math.round(amount),
      config.tiendaCommerceCode,
      `CH-${buyOrder}`.slice(0, MAX_BUY_ORDER_LENGTH),
      1,
    ),
  ];

  const response = await transaction.authorize(
    truncate(username, MAX_USERNAME_LENGTH),
    tbkUser,
    buyOrder,
    details,
  );

  const detail = response.details?.[0] || {};
  return {
    responseCode: detail.response_code,
    authorizationCode: detail.authorization_code,
    transactionDate: response.transaction_date,
    raw: response,
  };
};

export const refundCharge = async ({ buyOrder, amount }) => {
  const config = getTransbankConfig();
  const transaction = getMallTransactionInstance();
  return transaction.refund(
    buyOrder,
    config.tiendaCommerceCode,
    `CH-${buyOrder}`.slice(0, MAX_BUY_ORDER_LENGTH),
    Math.round(amount),
  );
};
