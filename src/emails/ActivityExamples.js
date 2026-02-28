import React from 'react';
import { Link, Text } from '@react-email/components';
import { BaseEmail } from './base';

export const ActivityExamplesEmail = ({ firstName, activities = [] }) => (
  <BaseEmail
    preview="Ideas de actividades para usar en Unga"
    title="3 actividades que otros docentes estan usando"
    greeting={`Hola ${firstName}, preparamos algunos ejemplos para inspirarte:`}
    body={[
      'Puedes abrir cada actividad y adaptarla a tu contexto en pocos pasos.',
      <Text key="links" style={{ marginTop: '6px' }}>
        {activities.map((activity, index) => (
          <React.Fragment key={activity.link}>
            <Link href={activity.link}>{`Actividad ${index + 1}`}</Link>
            <br />
          </React.Fragment>
        ))}
      </Text>,
    ]}
    buttonText="Explorar actividades"
    buttonUrl="https://app.unga.cl/activities"
    footer="Tip: guarda tus favoritas para reutilizarlas luego."
  />
);

export default ActivityExamplesEmail;
