import prisma from './prisma';

export const createDownloadedStudentsReport = async (data) => {
  const report = await prisma.downloadedStudentsReports.create({
    data: {
      institutionId: data.institutionId,
      downloadedById: data.downloadedById || null,
      reportData: data.reportData || {},
    },
    include: {
      Institutions: true,
      users: true,
    },
  });

  return report;
}

export const getDownloadedStudentsReports = async (institutionId) => {
  const reports = await prisma.downloadedStudentsReports.findMany({
    where: { institutionId },
    include: {
      Institutions: true,
      users: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reports;
}
