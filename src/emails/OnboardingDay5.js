import React from 'react';
import { OnboardingEmail } from './onboardingBase';

export const OnboardingDay5Email = ({ firstName, buttonUrl }) => (
  <OnboardingEmail
    preview="Lo que antes tomaba una tarde, ahora toma minutos"
    eyebrow="Beneficio Unga"
    emoji="🗓️"
    heroTitle={`${firstName}, tu semana planificada en minutos`}
    highlights={[
      'Guarda tus experiencias en tu biblioteca personal',
      'Agéndalas en el calendario semanal',
      'Descarga todo listo para imprimir',
    ]}
    callout="⏱️ Lo que antes tomaba una tarde entera, ahora toma minutos."
    buttonText="Ir a mi planificación"
    buttonUrl={buttonUrl}
  />
);

export default OnboardingDay5Email;
