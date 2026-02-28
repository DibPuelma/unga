import React from 'react';
import { BaseEmail } from './base';

export const EvaluationExplanationEmail = ({ firstName }) => (
  <BaseEmail
    preview="Evalua y haz seguimiento en Unga"
    title="Convierte observaciones en seguimiento real"
    greeting={`Hola ${firstName}, recuerda que en Unga puedes evaluar en segundos y ver avances por estudiante.`}
    body={[
      'Cuando evaluas de forma continua, identificas brechas mas temprano y puedes ajustar tus actividades con evidencia.',
      'Toda la informacion queda ordenada para facilitar conversaciones con familias y equipos directivos.',
    ]}
    buttonText="Ir a evaluaciones"
    buttonUrl="https://app.unga.cl/evaluations"
  />
);

export default EvaluationExplanationEmail;
