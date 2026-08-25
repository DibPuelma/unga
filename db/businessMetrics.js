import { B2C_PLANS } from 'src/helpers/plans';
import prisma from './prisma';

const SUBSCRIBED_STATUSES = ['active', 'payment_failed'];
const INSTITUTIONAL_TEACHER = { plan: 'institutional' };

// Todas las métricas de negocio para el dashboard super-admin, en un solo
// Promise.all. Retorna solo números/strings (serializable por getServerSideProps).
export const getBusinessMetrics = async ({ from, to }) => {
  const [
    subscribed,
    paymentFailedCount,
    cancelAtPeriodEndCount,
    newB2CUsers,
    newB2CUsersConverted,
    newSubscriptions,
    voluntaryChurn,
    involuntaryChurn,
    subscriptionRevenue,
    creditPackRevenue,
    rejectedPayments,
    activeB2CUsers,
    b2bInstitutions,
    activeB2BInstitutions,
    seatsByRole,
    activeB2BTeachers,
    b2bObservations,
    b2bEvaluations,
    b2bPlannedActivities,
  ] = await Promise.all([
    prisma.subscriptions.aggregate({
      _sum: { amount: true },
      _count: { _all: true },
      where: { status: { in: SUBSCRIBED_STATUSES } },
    }),
    prisma.subscriptions.count({ where: { status: 'payment_failed' } }),
    prisma.subscriptions.count({
      where: { status: { in: SUBSCRIBED_STATUSES }, cancelAtPeriodEnd: true },
    }),
    prisma.users.count({
      where: {
        createdAt: { gte: from, lt: to },
        plan: { in: B2C_PLANS },
        deletedAt: null,
        role: { not: 'superAdmin' },
      },
    }),
    prisma.users.count({
      where: {
        createdAt: { gte: from, lt: to },
        plan: { in: B2C_PLANS },
        deletedAt: null,
        role: { not: 'superAdmin' },
        paymentStartedAt: { not: null },
      },
    }),
    prisma.subscriptions.count({ where: { createdAt: { gte: from, lt: to } } }),
    // Voluntario vs involuntario según cancelAtPeriodEnd al finalizar: quien
    // cancela y además falla el pago cuenta como voluntario.
    prisma.subscriptions.count({
      where: { status: 'cancelled', cancelledAt: { gte: from, lt: to }, cancelAtPeriodEnd: true },
    }),
    prisma.subscriptions.count({
      where: { status: 'cancelled', cancelledAt: { gte: from, lt: to }, cancelAtPeriodEnd: false },
    }),
    prisma.payments.aggregate({
      _sum: { amount: true },
      _count: { _all: true },
      where: {
        status: 'approved',
        type: { in: ['subscription_first', 'subscription_renewal'] },
        createdAt: { gte: from, lt: to },
      },
    }),
    prisma.payments.aggregate({
      _sum: { amount: true, creditsGranted: true },
      _count: { _all: true },
      where: { status: 'approved', type: 'credit_pack', createdAt: { gte: from, lt: to } },
    }),
    prisma.payments.count({
      where: { status: 'rejected', createdAt: { gte: from, lt: to } },
    }),
    // 'consume' y no amount < 0: reset_forfeit también es negativo pero no es actividad.
    prisma.creditTransactions.groupBy({
      by: ['userId'],
      where: { reason: 'consume', createdAt: { gte: from, lt: to } },
    }),
    // users.some excluye las instituciones personales que crea el onboarding B2C.
    prisma.institutions.count({
      where: { deletedAt: null, users: { some: { plan: 'institutional', deletedAt: null } } },
    }),
    prisma.observations.groupBy({
      by: ['institutionId'],
      where: {
        observedAt: { gte: from, lt: to },
        deletedAt: null,
        institutionId: { not: null },
        users: INSTITUTIONAL_TEACHER,
      },
    }),
    prisma.users.groupBy({
      by: ['role'],
      _count: { _all: true },
      where: {
        plan: 'institutional',
        deletedAt: null,
        role: { in: ['principal', 'coordinator', 'teacher'] },
      },
    }),
    prisma.observations.groupBy({
      by: ['teacherId'],
      where: { observedAt: { gte: from, lt: to }, deletedAt: null, users: INSTITUTIONAL_TEACHER },
    }),
    prisma.observations.count({
      where: { observedAt: { gte: from, lt: to }, deletedAt: null, users: INSTITUTIONAL_TEACHER },
    }),
    prisma.evaluations.count({
      where: {
        createdAt: { gte: from, lt: to },
        users_Evaluations_teacherIdTousers: INSTITUTIONAL_TEACHER,
      },
    }),
    prisma.plannedActivities.count({
      where: {
        plannedDate: { gte: from, lt: to },
        deletedAt: null,
        users_PlannedActivities_teacherIdTousers: INSTITUTIONAL_TEACHER,
      },
    }),
  ]);

  return {
    b2c: {
      mrr: subscribed._sum.amount || 0,
      activeSubscribers: subscribed._count._all,
      paymentFailedCount,
      cancelAtPeriodEndCount,
      newB2CUsers,
      newB2CUsersConverted,
      newSubscriptions,
      voluntaryChurn,
      involuntaryChurn,
      subscriptionRevenue: subscriptionRevenue._sum.amount || 0,
      subscriptionPaymentsCount: subscriptionRevenue._count._all,
      creditPackRevenue: creditPackRevenue._sum.amount || 0,
      creditPacksSold: creditPackRevenue._count._all,
      creditsGranted: creditPackRevenue._sum.creditsGranted || 0,
      rejectedPayments,
      activeB2CUsers: activeB2CUsers.length,
    },
    b2b: {
      institutions: b2bInstitutions,
      activeInstitutions: activeB2BInstitutions.length,
      seatsByRole: Object.fromEntries(
        seatsByRole.map(({ role, _count }) => [role, _count._all])
      ),
      activeTeachers: activeB2BTeachers.length,
      observations: b2bObservations,
      evaluations: b2bEvaluations,
      plannedActivities: b2bPlannedActivities,
    },
  };
};
