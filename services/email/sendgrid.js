import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendTemplateEmail = (user, data, templateId) => {
  const fullName = `${user.firstName} ${user.lastName}`;
  const message = {
    personalizations: [
      {
        to: [
          {
            email: user.email,
            name: fullName,
          },
        ],
        "dynamic_template_data": data
      }
    ],
    "template_id": templateId,
    from: {
      email: 'esteban@ungapp.com',
      name: 'Esteban de Unga'
    },
    replyTo: {
      email: 'esteban@ungapp.com',
      name: 'Esteban de Unga'
    }
  }
  sgMail.send(message);
}

export default sgMail;