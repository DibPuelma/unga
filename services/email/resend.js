import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const defaultFrom = 'Esteban de Unga <esteban@ungapp.com>';
const defaultReplyTo = 'esteban@ungapp.com';

export const sendEmail = async ({ to, subject, react, from, replyTo }) => {
  if (!to || !subject || !react) return;

  return resend.emails.send({
    from: from || defaultFrom,
    to,
    subject,
    react,
    replyTo: replyTo || defaultReplyTo,
  });
};

export const sendBatchEmails = async (emails = []) => {
  if (!emails.length) return;

  return resend.batch.send(
    emails.map((email) => ({
      from: defaultFrom,
      replyTo: defaultReplyTo,
      ...email,
    })),
  );
};

export default resend;
