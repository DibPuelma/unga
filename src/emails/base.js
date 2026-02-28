import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export const BaseEmail = ({
  preview,
  title,
  greeting,
  body,
  buttonText,
  buttonUrl,
  footer,
}) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Text style={styles.brand}>Unga</Text>
        <Text style={styles.title}>{title}</Text>
        {greeting ? <Text style={styles.text}>{greeting}</Text> : null}
        {Array.isArray(body)
          ? body.map((paragraph, index) =>
              typeof paragraph === 'string' ? (
                <Text key={`${index}-${paragraph}`} style={styles.text}>
                  {paragraph}
                </Text>
              ) : (
                <React.Fragment key={index}>{paragraph}</React.Fragment>
              ),
            )
          : null}
        {buttonText && buttonUrl ? (
          <Section style={styles.center}>
            <Button href={buttonUrl} style={styles.button}>
              {buttonText}
            </Button>
          </Section>
        ) : null}
        {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      </Container>
    </Body>
  </Html>
);

export const EmailLink = ({ href, children }) => (
  <Link href={href} style={styles.link}>
    {children}
  </Link>
);

const styles = {
  body: {
    backgroundColor: '#f7f7fb',
    fontFamily: 'Helvetica, Arial, sans-serif',
    padding: '20px 0',
  },
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #ececf2',
    borderRadius: '10px',
    margin: '0 auto',
    maxWidth: '620px',
    padding: '24px',
  },
  brand: {
    color: '#e69b6f',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 8px',
    textAlign: 'center',
  },
  title: {
    color: '#111827',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 16px',
    textAlign: 'center',
  },
  text: {
    color: '#374151',
    fontSize: '15px',
    lineHeight: '1.5',
    margin: '10px 0',
  },
  center: {
    marginTop: '18px',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e69b6f',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    padding: '12px 18px',
    textDecoration: 'none',
  },
  footer: {
    color: '#6b7280',
    fontSize: '13px',
    marginTop: '20px',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
  },
};
