import React from 'react';
import { OnboardingEmail } from './onboardingBase';

export const OnboardingDay1Email = ({ firstName, buttonUrl }) => (
  <OnboardingEmail
    preview="Sin prompts, sin tarjeta: tu primera experiencia en segundos"
    eyebrow="Bienvenida a Unga"
    emoji="🪄"
    heroTitle={`Hola ${firstName}, crea tu primera experiencia en segundos`}
    heroSubtitle="Sin escribir prompts ni saber de IA."
    highlights={[
      'Elige la edad de tu grupo y un tema',
      'Suma los materiales que tienes a mano',
      'Recibe una experiencia completa, lista para usar',
    ]}
    callout="🎁 Tienes 5 creaciones de regalo, sin necesidad de tarjeta."
    buttonText="Crear mi primera experiencia"
    buttonUrl={buttonUrl}
  />
);

export default OnboardingDay1Email;
