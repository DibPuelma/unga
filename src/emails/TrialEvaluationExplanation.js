import React from 'react';
import { BaseEmail } from './base';

export const TrialEvaluationExplanationEmail = ({ firstName }) => (
  <BaseEmail
    preview="Mide avances durante tu prueba"
    title="Evalua de forma simple y constante"
    greeting={`Hola ${firstName}, evaluar frecuentemente en Unga te mostrara avances reales en pocos dias.`}
    body={[
      'Puedes registrar evidencia en minutos y luego revisar resultados por estudiante o por curso.',
    ]}
    buttonText="Ir a evaluaciones"
    buttonUrl="https://app.unga.cl/evaluations"
  />
);

export default TrialEvaluationExplanationEmail;
