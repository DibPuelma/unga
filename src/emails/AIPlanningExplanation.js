import React from 'react';
import { BaseEmail } from './base';

export const AIPlanningExplanationEmail = ({ firstName }) => (
  <BaseEmail
    preview="Planificacion asistida por IA"
    title="Crea planificaciones mas rapido con IA"
    greeting={`Hola ${firstName}, ya puedes usar la asistencia de IA en Unga para acelerar tu planificacion.`}
    body={[
      'La IA te ayuda a proponer actividades y ajustar objetivos en base al nivel de tus estudiantes.',
      'Puedes tomar una sugerencia y editarla facilmente para que quede alineada con tu clase.',
    ]}
    buttonText="Probar planificacion con IA"
    buttonUrl="https://app.unga.cl/planning"
  />
);

export default AIPlanningExplanationEmail;
