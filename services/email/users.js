import moment from 'moment-timezone';
import sendgrid, { sendTemplateEmail } from './sendgrid';

export const sendTeacherWelcomeEmail = (user) => {
  const data = {
    firstName: user.firstName,
  }
  const templateId = 'd-498aa1ec0cd74badb822bad9cb6a6b20';
  sendTemplateEmail(user, data, templateId);
}

export const sendParentWelcomeEmail = (user) => {
  const data = {
    firstName: user.firstName,
  }
  const templateId = 'd-d64a781fbd514fb986f5a8f4363302d6';
  sendTemplateEmail(user, data, templateId);
}

export const sendTrialEndingReminders = (users) => {
  const message = {
    personalizations: users.map((user) => ({
      to: [
        {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`
        },
      ],
      "dynamic_template_data": {
        firstName: user.firstName,
        paymentDate: moment(user.trialEndsAt).format('dddd DD'),
      }
    })),
    "template_id": 'd-51251362016a4f37bae64b3a517308c8',
    from: {
      email: 'esteban@ungapp.com',
      name: 'Esteban de Unga'
    },
    replyTo: {
      email: 'esteban@ungapp.com',
      name: 'Esteban de Unga'
    }
  }
  sendgrid.send(message);
}

export const sendExampleActivitiesEmail = (users, activitiesIds) => {
  const message = {
    personalizations: users.map((user) => ({
      to: [
        {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`
        },
      ],
      "dynamic_template_data": {
        firstName: user.firstName,
        activities: activitiesIds.map((id) => ({
          link: `https://app.unga.cl/activities/${id}`
        }))
      }
    })),
    "template_id": 'd-8c11cf5871144978b4c069f175da0883',
    from: {
      email: 'esteban@ungapp.com',
      name: 'Esteban de Unga'
    },
    replyTo: {
      email: 'esteban@ungapp.com',
      name: 'Esteban de Unga'
    },
  }

  sendgrid.send(message);
}

export const sendGenericMassiveEmailWithFirstName = ({ users, templateId }) => {
  const message = {
    personalizations: users.map((user) => ({
      to: [
        {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`
        },
      ],
      "dynamic_template_data": {
        firstName: user.firstName,
      }
    })),
    "template_id": templateId,
    from: {
      email: 'esteban@ungapp.com',
      name: 'Esteban de Unga'
    },
    replyTo: {
      email: 'esteban@ungapp.com',
      name: 'Esteban de Unga'
    },
  }

  sendgrid.send(message);
}