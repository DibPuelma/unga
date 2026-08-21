import prisma from './prisma';

export const createPayment = async (data) => {
  return prisma.payments.create({ data });
};

export const getPaymentByBuyOrder = async (buyOrder) => {
  return prisma.payments.findUnique({ where: { buyOrder } });
};
