import prisma from "./prisma"
import SendNewPMFAnswerSlackMessage from "commands/slack/SendNewPMFAnswerSlackMessage";
import moment from "moment-timezone";

export const getThisMonthPMFAnswer = async (userId) => {
  const startOfMonth = moment().startOf('month').toDate();
  const endOfMonth = moment().endOf('month').toDate();

  const answer = await prisma.pMFAnswers.findFirst({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return answer;
}

export const createPMFAnswer = async ({ dissapointment, why, improvements, askAgainDate, userId, snoozeCount }) => {
  const answer = await prisma.pMFAnswers.create({
    data: {
      dissapointment,
      why,
      improvements,
      snoozeCount: snoozeCount || 0,
      userId,
      askAgainDate: new Date(askAgainDate),
      answeredAt: dissapointment ? new Date() : null,
    },
    include: {
      users: true,
    },
  });

  const result = answer;

  if (answer.dissapointment) {
    new SendNewPMFAnswerSlackMessage(result).perform();
  }

  return result;
}

export const updatePMFAnswer = async (id, { dissapointment, why, improvements, askAgainDate, snoozeCount }) => {
  const answer = await prisma.pMFAnswers.update({
    where: { id },
    data: {
      dissapointment,
      why,
      improvements,
      snoozeCount: snoozeCount || 0,
      answeredAt: dissapointment ? new Date() : null,
      askAgainDate: new Date(askAgainDate),
    },
    include: {
      users: true,
    },
  });

  const result = answer;

  if (answer.dissapointment) {
    new SendNewPMFAnswerSlackMessage(result).perform();
  }

  return result;
}

export const getLastMonthPmfAnswers = async () => {
  const thirtyDaysAgo = moment().subtract(30, 'days').toDate();

  const answers = await prisma.pMFAnswers.findMany({
    where: {
      answeredAt: {
        gte: thirtyDaysAgo,
      },
      users: {
        deletedAt: null,
      },
    },
    include: {
      users: {
        include: {
          Institutions: true,
        },
      },
    },
    take: 1000,
  });

  return answers.map((a) => ({
    ...a,
    user: a.users,
    institution: a.users?.Institutions || null,
  }));
}
