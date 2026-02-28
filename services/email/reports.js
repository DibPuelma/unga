// import { html, text } from 'src/emails/teachersWeeklyStats';
// import transport, { defaultFrom, host } from './transport';

// export const emailTeachersWeeklyStats = (teachers) => {
//   for (let i = 0; i < teachers.length; i++) {
//     const teacher = teachers[i];
//     transport.sendMail({
//       to: teacher.email,
//       from: defaultFrom,
//       subject: `${teacher.firstName}, tu semana en Unga`,
//       text: text({ host, teacher }),
//       html: html({ host, teacher }),
//     })
//   }
// }