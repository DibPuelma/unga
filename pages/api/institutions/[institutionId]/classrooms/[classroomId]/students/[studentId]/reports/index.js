import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import CloudinaryService from 'services/CloudinaryService';
import { createDownloadedReport } from 'db/downloadedStudentsReport';
import PuppeteerService from 'services/PuppeteerService';


export default async (req, res) => {
  const { query: { institutionId, classroomId, studentId }, body } = req;
  const { user } = await getServerSession(req, res, authOptions);
  if (user.institution.id !== institutionId || !user.classrooms.includes(classroomId)) {
    return res.status(403).end();
  }

  if (req.method === 'POST') {
    if (body.savePDF) {
      const puppeteerService = new PuppeteerService();
      try {
        const pdf = await puppeteerService.pdfFromHtmlAsBase64(body.html);
        const fileUpload = await CloudinaryService.upload(pdf);
        await createDownloadedReport({
          asset: fileUpload,
          studentId,
          classroomId,
          institutionId,
          teacherId: user.id,
          timePeriods: body.timePeriods,
          advancementByCore: body.advancementByCore,
        })
        return res.status(200).json(fileUpload);
      } catch (e) {
        console.error(e)
        return res.status(500).end();
      }
    }
  }
};