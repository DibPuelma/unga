import React from 'react';
import { OnboardingEmail } from './onboardingBase';

export const OnboardingDay3Email = ({ firstName, buttonUrl }) => (
  <OnboardingEmail
    preview="Inicio, desarrollo, cierre y Objetivos BCEP, listos para imprimir"
    eyebrow="Beneficio Unga"
    emoji="🎯"
    heroTitle={`${firstName}, cada experiencia va alineada a las Bases Curriculares`}
    highlights={[
      'Inicio, desarrollo y cierre ya definidos',
      'Materiales de bajo costo y preguntas para el aprendizaje',
      'Objetivos de Aprendizaje BCEP identificados, con cómo se aborda cada uno',
    ]}
    callout="📄 Se descarga en PDF, lista para tu carpeta de planificación."
    buttonText="Ver mis experiencias"
    buttonUrl={buttonUrl}
  />
);

export default OnboardingDay3Email;
