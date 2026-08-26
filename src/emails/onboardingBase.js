import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export const OnboardingEmail = ({
  preview,
  eyebrow,
  emoji,
  heroTitle,
  heroSubtitle,
  highlights = [],
  callout,
  buttonText,
  buttonUrl,
  footer,
}) => (
  <Html lang="es">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={styles.body}>
      <Container style={styles.container}>
        <Section style={styles.logoWrap}>
          <Img
            src="https://www.unga.cl/logo-orange.png"
            alt="Unga"
            width="48"
            height="48"
          />
        </Section>

        <Section style={styles.hero}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          {heroSubtitle ? <Text style={styles.heroSubtitle}>{heroSubtitle}</Text> : null}
        </Section>

        <Section style={styles.body_}>
          {highlights.map((item, index) => (
            <Text key={`${index}-${item}`} style={styles.highlight}>
              <span style={styles.checkmark}>✓</span> {item}
            </Text>
          ))}

          {callout ? (
            <Section style={styles.callout}>
              <Text style={styles.calloutText}>{callout}</Text>
            </Section>
          ) : null}

          <Section style={styles.center}>
            <Button href={buttonUrl} style={styles.button}>
              {buttonText}
            </Button>
          </Section>
        </Section>

        <Hr style={styles.hr} />
        <Text style={styles.footer}>
          {footer || 'Unga · Acompañando la educación inicial'}
        </Text>
      </Container>
    </Body>
  </Html>
);

const styles = {
  body: {
    backgroundColor: '#f7f3ee',
    fontFamily: 'Helvetica, Arial, sans-serif',
    padding: '32px 12px',
  },
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #ececf2',
    borderRadius: '16px',
    margin: '0 auto',
    maxWidth: '560px',
    overflow: 'hidden',
    padding: '0',
  },
  logoWrap: {
    padding: '24px 24px 0',
    textAlign: 'center',
  },
  hero: {
    backgroundColor: '#fff2e6',
    padding: '20px 32px 28px',
    textAlign: 'center',
  },
  eyebrow: {
    color: '#e6763a',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '1px',
    margin: '0 0 6px',
    textTransform: 'uppercase',
  },
  emoji: {
    fontSize: '40px',
    lineHeight: '1',
    margin: '0 0 8px',
  },
  heroTitle: {
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '800',
    lineHeight: '1.3',
    margin: '0',
  },
  heroSubtitle: {
    color: '#57534e',
    fontSize: '15px',
    lineHeight: '1.5',
    margin: '10px 0 0',
  },
  body_: {
    padding: '28px 32px 8px',
  },
  highlight: {
    color: '#374151',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 12px',
  },
  checkmark: {
    color: '#e6763a',
    fontWeight: '800',
  },
  callout: {
    backgroundColor: '#fff9f0',
    border: '1px solid #ffe1c2',
    borderRadius: '10px',
    margin: '16px 0 8px',
    padding: '14px 18px',
  },
  calloutText: {
    color: '#9a5a1f',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.5',
    margin: '0',
  },
  center: {
    marginTop: '24px',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e6763a',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(230, 118, 58, 0.35)',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '700',
    padding: '14px 28px',
    textDecoration: 'none',
  },
  hr: {
    borderColor: '#ececf2',
    margin: '24px 32px 16px',
  },
  footer: {
    color: '#9ca3af',
    fontSize: '12px',
    margin: '0 32px 24px',
    textAlign: 'center',
  },
};

export default OnboardingEmail;
