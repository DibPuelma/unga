import prisma from './prisma';

export const createOpenAIApiCall = async (data) => {
  const call = await prisma.openAIApiCall.create({
    data: {
      userId: data.userId,
      prompt: data.prompt || null,
      response: data.response || null,
      model: data.model || null,
      tokensUsed: data.tokensUsed || null,
    },
    include: {
      user: true,
    },
  });

  return call;
}

export const getOpenAIApiCalls = async (userId) => {
  const calls = await prisma.openAIApiCall.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return calls;
}
