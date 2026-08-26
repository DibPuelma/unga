import moment from 'moment-timezone';
import React from 'react';
import { sendBatchEmails, sendEmail } from './resend';
import { generateMagicLoginUrl } from 'services/auth/magicLink';
import TeacherWelcomeEmail from 'src/emails/TeacherWelcome';
import ParentWelcomeEmail from 'src/emails/ParentWelcome';

export const sendTeacherWelcomeEmail = async (user) =>
  sendEmail({
    to: user.email,
    subject: 'Bienvenida a Unga',
    react: <TeacherWelcomeEmail firstName={user.firstName} />,
  });

export const sendParentWelcomeEmail = async (user) =>
  sendEmail({
    to: user.email,
    subject: 'Bienvenida a Unga',
    react: <ParentWelcomeEmail firstName={user.firstName} />,
  });

export const sendGenericMassiveEmailWithMagicLink = async ({
  users,
  EmailComponent,
  subject,
  callbackUrl,
}) => {
  const urls = await Promise.all(
    users.map((user) => generateMagicLoginUrl({ email: user.email, callbackUrl })),
  );

  return sendBatchEmails(
    users.map((user, index) => ({
      to: user.email,
      subject,
      react: <EmailComponent firstName={user.firstName} buttonUrl={urls[index]} />,
    })),
  );
};