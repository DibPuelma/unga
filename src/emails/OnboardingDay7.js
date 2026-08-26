import React from 'react';
import { OnboardingEmail } from './onboardingBase';

export const OnboardingDay7Email = ({ firstName, buttonUrl }) => (
  <OnboardingEmail
    preview="Tu resumen de la semana + un beneficio por invitar amigas"
    eyebrow="Un recap para ti"
    emoji="🌟"
    heroTitle={`${firstName}, esto es todo lo que ganas con Unga`}
    highlights={[
      '⚡ Experiencias completas en segundos',
      '🎯 Alineadas a las Bases Curriculares',
      '📄 PDF listo para imprimir',
      '🗓️ Tu semana organizada en minutos',
    ]}
    callout="💛 ¿Ya usaste tus creaciones de regalo? El plan mensual te da 100 creaciones por $4.990, y cancelas cuando quieras. Además, con «Invita y gana» sumas beneficios por cada colega que invites."
    buttonText="Seguir creando con Unga"
    buttonUrl={buttonUrl}
  />
);

export default OnboardingDay7Email;
