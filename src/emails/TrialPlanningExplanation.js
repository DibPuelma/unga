import React from 'react';
import { BaseEmail } from './base';

export const TrialPlanningExplanationEmail = ({ firstName }) => (
  <BaseEmail
    preview="Primer paso recomendado en tu prueba"
    title="Comienza con la planificacion semanal"
    greeting={`Hola ${firstName}, para aprovechar tu prueba te recomendamos empezar por la planificacion.`}
    body={[
      'Al planificar tu semana en Unga veras rapidamente el valor de centralizar objetivos, actividades y seguimiento.',
    ]}
    buttonText="Empezar a planificar"
    buttonUrl="https://app.unga.cl/planning"
  />
);

export default TrialPlanningExplanationEmail;
