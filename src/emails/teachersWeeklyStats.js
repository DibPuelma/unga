const getEmojiAndMessage = (item, scale) => {
  const emojisAndMessages = [
    ['&#128525;', `WOW, vas como avión, ¡sigue así!`],
    ['&#128526;', `Bien hecho, estás dentro de lo recomendado`],
    ['&#128533;', `¡Ya casi! Con ${scale[1]} a la semana estarías perfecto.`],
    ['&#128532;', `¡Ánimo! Sabemos que cuesta. Lo recomendado es ${scale[1]} a la semana.`],
    ['&#128546;', `¿Necesitas ayuda? Siempre nos puedes contactar al +44 7543 814676`],
  ]
  for (let i = 0; i < scale.length; i++) {
    const value = scale[i];
    if (item >= value) return emojisAndMessages[i];
  }
  return ['', ''];
}

// Email HTML body
export function html({ host, teacher }) {
  const {
    observations,
    evaluations,
    activities,
    plannedActivities,
    firstName,
  } = teacher;
  const [observationsEmoji, observationsMessage] = getEmojiAndMessage(observations, [30, 15, 5, 2, 0])
  const [evaluationsEmoji, evaluationsMessage] = getEmojiAndMessage(evaluations, [80, 45, 15, 5, 0])
  const [activitiesEmoji, activitiesMessage] = getEmojiAndMessage(activities, [20, 15, 10, 5, 0])
  const [plannedActivitiesEmoji, plannedActivitiesMessage] = getEmojiAndMessage(plannedActivities, [20, 15, 10, 5, 0])

  const buttonBackgroundColor = "#e69b6f"
  const buttonBorderColor = "#e69b6f"
  const buttonTextColor = "#ffffff"

  return `
    <body>
      <p style="text-align: center; font-size: medium; font-family: Helvetica, Arial, sans-serif;">¡Hola ${firstName}! Esta fue tu actividad la semana pasada</p>
      <table width="100%" border="0" cellspacing="20" cellpadding="0"
        style="max-width: 600px; margin: auto; border-radius: 10px; margin-bottom: 15px;">
        <tr>
          <td align="center" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4; border-radius: 5px; padding: 15px;">
            <p style="font-size: x-large; margin-bottom: 0;">${observations} observaciones</p>
            <p style="margin-top: 5px; font-size: small;">${observationsMessage}</p>
          </td>
          <td align="center" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4; border-radius: 5px; padding: 15px;">
            <p style="font-size: x-large; margin-bottom: 0;">${evaluations} evaluaciones</p>
            <p style="margin-top: 5px; font-size: small;">${evaluationsMessage}</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4; border-radius: 5px; padding: 15px;">
            <p style="font-size: x-large; margin-bottom: 0;">${activities} experiencias creadas</p>
            <p style="margin-top: 5px; font-size: small;">${activitiesMessage}</p>
          </td>
          <td align="center" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4; border-radius: 5px; padding: 15px;">
            <p style="font-size: x-large; margin-bottom: 0;">${plannedActivities} experiencias planificadas</p>
            <p style="margin-top: 5px; font-size: small;">${plannedActivitiesMessage}</p>
          </td>
          </tr>
          </tr>
      </table>
      <table border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}"><a href="${host}" target="_blank"
              style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonTextColor}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${buttonBorderColor}; display: inline-block; font-weight: bold;">Ingresar
              a Unga</a>
          </td>
        </tr>
      </table>
    </body>
  `
}

// Email Text body (fallback for email clients that don't render HTML, e.g. feature phones)
export function text({ host, teacher }) {
  const {
    observations,
    evaluations,
    activities,
    plannedActivities,
    firstName,
  } = teacher;

  const [observationsEmoji, observationsMessage] = getEmojiAndMessage(observations, [30, 15, 5, 2, 0])
  const [evaluationsEmoji, evaluationsMessage] = getEmojiAndMessage(evaluations, [80, 45, 15, 5, 0])
  const [activitiesEmoji, activitiesMessage] = getEmojiAndMessage(activities, [20, 15, 10, 5, 0])
  const [plannedActivitiesEmoji, plannedActivitiesMessage] = getEmojiAndMessage(plannedActivities, [20, 15, 10, 5, 0])

  return `
    ¡Hola ${firstName}! Esta fue tu actividad la semana pasada \n
    Realizaste ${observations} observaciones. ${observationsMessage}\n
    Evaluaste ${evaluations} veces. ${evaluationsMessage}\n
    Creaste ${activities} experiencias. ${activitiesMessage}\n
    Planificaste ${plannedActivities} experiencias. ${plannedActivitiesMessage}\n
    Recuerda que puedes entrar a Unga aquí: ${host}
  `
}