import React from 'react';
import { BaseEmail } from './base';

const appUrl = 'https://app.unga.cl/payments/individual-plan';

export const TrialEndingReminderEmail = ({ firstName, paymentDate }) => (
  <BaseEmail
    preview="Tu prueba de Unga esta por terminar"
    title="Tu prueba termina pronto"
    greeting={`Hola ${firstName}, te recordamos que tu periodo de prueba termina ${paymentDate}.`}
    body={[
      'Para seguir usando todas las funciones de Unga sin interrupciones, puedes activar tu plan en pocos minutos.',
    ]}
    buttonText="Activar mi plan"
    buttonUrl={appUrl}
    footer="Si ya activaste tu plan, puedes ignorar este recordatorio."
  />
);

export default TrialEndingReminderEmail;
