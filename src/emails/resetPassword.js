import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export const ResetPasswordEmail = ({ url, host }) => (
  <Html>
    <Head />
    <Preview>Cambia tu contrasena en Unga</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Text style={styles.brand}>{host}</Text>
        <Text style={styles.title}>Cambia tu contrasena en Unga</Text>
        <Section style={styles.center}>
          <Button href={url} style={styles.button}>
            Cambiar contrasena
          </Button>
        </Section>
        <Text style={styles.footer}>Si no solicitaste este email, ignoralo.</Text>
      </Container>
    </Body>
  </Html>
);

const styles = {
  body: {
    backgroundColor: '#f9f9f9',
    fontFamily: 'Helvetica, Arial, sans-serif',
    padding: '20px 0',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    margin: '0 auto',
    maxWidth: '600px',
    padding: '20px',
  },
  brand: {
    color: '#444444',
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 8px',
    textAlign: 'center',
  },
  title: {
    color: '#444444',
    fontSize: '18px',
    margin: '0 0 20px',
    textAlign: 'center',
  },
  center: {
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#346df1',
    borderRadius: '5px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    padding: '12px 20px',
    textDecoration: 'none',
  },
  footer: {
    color: '#444444',
    fontSize: '14px',
    marginTop: '20px',
    textAlign: 'center',
  },
};

export default ResetPasswordEmail;