import moment from 'moment-timezone';
import React from 'react';
import { sendBatchEmails, sendEmail } from './resend';
import TeacherWelcomeEmail from 'src/emails/TeacherWelcome';
import ParentWelcomeEmail from 'src/emails/ParentWelcome';
import TrialEndingReminderEmail from 'src/emails/TrialEndingReminder';
import ActivityExamplesEmail from 'src/emails/ActivityExamples';

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

export const sendTrialEndingReminders = async (users) =>
  sendBatchEmails(
    users.map((user) => ({
      to: user.email,
      subject: 'Tu prueba de Unga esta por terminar',
      react: (
        <TrialEndingReminderEmail
          firstName={user.firstName}
          paymentDate={moment(user.trialEndsAt).format('dddd DD')}
        />
      ),
    })),
  );

export const sendExampleActivitiesEmail = async (users, activitiesIds) => {
  const activities = activitiesIds.map((id) => ({
    link: `https://app.unga.cl/activities/${id}`,
  }));

  return sendBatchEmails(
    users.map((user) => ({
      to: user.email,
      subject: 'Ideas de actividades para tu curso',
      react: <ActivityExamplesEmail firstName={user.firstName} activities={activities} />,
    })),
  );
};

export const sendGenericMassiveEmailWithFirstName = async ({
  users,
  EmailComponent,
  subject,
}) =>
  sendBatchEmails(
    users.map((user) => ({
      to: user.email,
      subject,
      react: <EmailComponent firstName={user.firstName} />,
    })),
  );