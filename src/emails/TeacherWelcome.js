import React from 'react';
import { BaseEmail } from './base';

const appUrl = 'https://app.unga.cl';

export const TeacherWelcomeEmail = ({ firstName }) => (
  <BaseEmail
    preview="Bienvenida a Unga"
    title="Tu cuenta de Unga ya esta lista"
    greeting={`Hola ${firstName}, bienvenida a Unga.`}
    body={[
      'Nos alegra tenerte en la comunidad. Desde aqui podras planificar experiencias, observar, evaluar y hacer seguimiento de tus estudiantes.',
      'Te recomendamos ingresar hoy para crear tu primera experiencia y dejar lista tu planificacion de la semana.',
    ]}
    buttonText="Entrar a Unga"
    buttonUrl={appUrl}
    footer="Si tienes dudas, responde este correo y te ayudamos."
  />
);

export default TeacherWelcomeEmail;
