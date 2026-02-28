import React from 'react';
import { BaseEmail } from './base';

const appUrl = 'https://app.unga.cl';

export const ParentWelcomeEmail = ({ firstName }) => (
  <BaseEmail
    preview="Bienvenida a Unga"
    title="Comienza tu experiencia en Unga"
    greeting={`Hola ${firstName}, bienvenida a Unga.`}
    body={[
      'Tu cuenta ya esta activa. Ahora puedes revisar actividades, observaciones y avances en un solo lugar.',
      'Te invitamos a entrar y explorar las funcionalidades disponibles para tu rol.',
    ]}
    buttonText="Ingresar a Unga"
    buttonUrl={appUrl}
    footer="Estamos disponibles si necesitas ayuda para empezar."
  />
);

export default ParentWelcomeEmail;
