import prisma from './prisma';

export const createDownloadedStudentsReport = async (data) => {
  const report = await prisma.downloadedStudentsReport.create({
    data: {
      institutionId: data.institutionId,
      downloadedById: data.downloadedById || null,
      reportData: data.reportData || {},
    },
    include: {
      institution: true,
      downloadedBy: true,
    },
  });

  return report;
}

export const getDownloadedStudentsReports = async (institutionId) => {
  const reports = await prisma.downloadedStudentsReport.findMany({
    where: { institutionId },
    include: {
      institution: true,
      downloadedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return reports;
}
