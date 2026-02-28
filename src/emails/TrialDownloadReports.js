import React from 'react';
import { BaseEmail } from './base';

export const TrialDownloadReportsEmail = ({ firstName }) => (
  <BaseEmail
    preview="Descarga reportes en tu prueba"
    title="Comparte avances con reportes listos"
    greeting={`Hola ${firstName}, en Unga puedes descargar reportes para compartir avances con tu comunidad educativa.`}
    body={[
      'Los reportes te ayudan a comunicar resultados con claridad a familias y equipos de apoyo.',
    ]}
    buttonText="Ver reportes"
    buttonUrl="https://app.unga.cl/reports"
  />
);

export default TrialDownloadReportsEmail;
