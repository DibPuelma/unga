import { Oneclick } from 'transbank-sdk';

// Oneclick Mall uses TWO commerce codes: the mall code builds the SDK
// instances; the tienda (child) code goes inside each TransactionDetail and
// in refunds. Integration credentials are Transbank's public test values.
const INTEGRATION_DEFAULTS = {
  mallCommerceCode: '597055555541',
  tiendaCommerceCode: '597055555542',
  apiKey: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
};

export const getTransbankConfig = () => {
  const environment = process.env.TRANSBANK_ENVIRONMENT || 'integration';
  const isProduction = environment === 'production';

  const config = {
    environment,
    mallCommerceCode: process.env.TRANSBANK_ONECLICK_MALL_COMMERCE_CODE
      || (isProduction ? null : INTEGRATION_DEFAULTS.mallCommerceCode),
    tiendaCommerceCode: process.env.TRANSBANK_ONECLICK_TIENDA_COMMERCE_CODE
      || (isProduction ? null : INTEGRATION_DEFAULTS.tiendaCommerceCode),
    apiKey: process.env.TRANSBANK_API_KEY
      || (isProduction ? null : INTEGRATION_DEFAULTS.apiKey),
  };

  if (!config.mallCommerceCode || !config.tiendaCommerceCode || !config.apiKey) {
    throw new Error('Transbank configuration is incomplete');
  }

  return config;
};

export const getInscriptionInstance = () => {
  const config = getTransbankConfig();
  return config.environment === 'production'
    ? Oneclick.MallInscription.buildForProduction(config.mallCommerceCode, config.apiKey)
    : Oneclick.MallInscription.buildForIntegration(config.mallCommerceCode, config.apiKey);
};

export const getMallTransactionInstance = () => {
  const config = getTransbankConfig();
  return config.environment === 'production'
    ? Oneclick.MallTransaction.buildForProduction(config.mallCommerceCode, config.apiKey)
    : Oneclick.MallTransaction.buildForIntegration(config.mallCommerceCode, config.apiKey);
};
