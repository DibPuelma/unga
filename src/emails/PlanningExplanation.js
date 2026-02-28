import React from 'react';
import { BaseEmail } from './base';

export const PlanningExplanationEmail = ({ firstName }) => (
  <BaseEmail
    preview="Planifica tus experiencias en Unga"
    title="Planifica con menos tiempo y mas orden"
    greeting={`Hola ${firstName}, este es un recordatorio rapido para aprovechar la planificacion en Unga.`}
    body={[
      'Con la planificacion semanal puedes ordenar tus experiencias por objetivo y tener visibilidad de todo el curso.',
      'Una buena planificacion te permite dedicar mas tiempo a la sala y menos a tareas administrativas.',
    ]}
    buttonText="Ir a planificacion"
    buttonUrl="https://app.unga.cl/planning"
  />
);

export default PlanningExplanationEmail;
