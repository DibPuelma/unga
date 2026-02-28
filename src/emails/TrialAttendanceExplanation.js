import React from 'react';
import { BaseEmail } from './base';

export const TrialAttendanceExplanationEmail = ({ firstName }) => (
  <BaseEmail
    preview="Controla asistencia en Unga"
    title="Registra asistencia en segundos"
    greeting={`Hola ${firstName}, la asistencia tambien la puedes gestionar facilmente desde Unga.`}
    body={[
      'Con registros diarios podras detectar patrones de inasistencia y actuar con mayor anticipacion.',
    ]}
    buttonText="Ir a asistencia"
    buttonUrl="https://app.unga.cl/attendance"
  />
);

export default TrialAttendanceExplanationEmail;
