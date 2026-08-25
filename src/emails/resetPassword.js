import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export const ResetPasswordEmail = ({ url, host, email }) => (
  <Html lang="es">
    <Head />
    <Preview>Crea una nueva contraseña para tu cuenta de Unga. El enlace expira en 24 horas.</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section style={styles.center}>
          <Img
            src="https://www.unga.cl/logo-orange.png"
            alt="Unga"
            width="64"
            height="64"
            style={styles.logo}
          />
        </Section>
        <Text style={styles.title}>Restablece tu contraseña</Text>
        <Text style={styles.text}>
          Recibimos una solicitud para restablecer la contraseña de tu cuenta de
          Unga asociada a <strong>{email}</strong>. Haz clic en el botón para
          crear una nueva contraseña.
        </Text>
        <Section style={styles.center}>
          <Button href={url} style={styles.button}>
            Crear nueva contraseña
          </Button>
        </Section>
        <Text style={styles.note}>
          Por seguridad, este enlace expira en 24 horas y solo se puede usar una
          vez.
        </Text>
        <Hr style={styles.hr} />
        <Text style={styles.fallback}>
          Si el botón no funciona, copia y pega este enlace en tu navegador:
        </Text>
        <Link href={url} style={styles.fallbackLink}>
          {url}
        </Link>
        <Hr style={styles.hr} />
        <Text style={styles.footer}>
          Recibiste este correo porque alguien pidió restablecer la contraseña
          de esta cuenta en {host}. Si no fuiste tú, puedes ignorarlo: tu
          contraseña actual seguirá funcionando.
        </Text>
      </Container>
      <Text style={styles.signature}>Unga · Acompañando la educación inicial</Text>
    </Body>
  </Html>
);

const styles = {
  body: {
    backgroundColor: '#f7f7fb',
    fontFamily: 'Helvetica, Arial, sans-serif',
    padding: '32px 12px',
  },
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #ececf2',
    borderRadius: '12px',
    margin: '0 auto',
    maxWidth: '460px',
    padding: '32px 32px 24px',
  },
  center: {
    textAlign: 'center',
  },
  logo: {
    display: 'inline-block',
    margin: '0 auto 4px',
  },
  title: {
    color: '#1f2937',
    fontSize: '22px',
    fontWeight: '700',
    margin: '12px 0 16px',
    textAlign: 'center',
  },
  text: {
    color: '#4b5563',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 20px',
  },
  button: {
    backgroundColor: '#e6763a',
    borderRadius: '8px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: '700',
    padding: '13px 32px',
    textDecoration: 'none',
  },
  note: {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '16px 0 0',
    textAlign: 'center',
  },
  hr: {
    borderColor: '#ececf2',
    margin: '24px 0 16px',
  },
  fallback: {
    color: '#6b7280',
    fontSize: '13px',
    lineHeight: '1.5',
    margin: '0 0 6px',
  },
  fallbackLink: {
    color: '#2563eb',
    fontSize: '12px',
    lineHeight: '1.5',
    textDecoration: 'underline',
    wordBreak: 'break-all',
  },
  footer: {
    color: '#9ca3af',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '0',
  },
  signature: {
    color: '#9ca3af',
    fontSize: '12px',
    margin: '16px 0 0',
    textAlign: 'center',
  },
};

export default ResetPasswordEmail;
