import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import CloudinaryService from 'services/CloudinaryService';
import { createDownloadedStudentsReport } from 'db/downloadedStudentsReport';
import PuppeteerService from 'services/PuppeteerService';
import { classroomAuthorization } from "pages/api/auth/authorizations";


export default async (req, res) => {
  const { query: { institutionId, classroomId, studentId }, body } = req;
  const { user } = await getServerSession(req, res, authOptions);
  if (!await classroomAuthorization(user, classroomId)) {
    return res.status(403).end();
  }

  if (req.method === 'POST') {
    if (body.savePDF) {
      const puppeteerService = new PuppeteerService();
      try {
        const pdf = await puppeteerService.pdfFromHtmlAsBase64(body.html);
        const fileUpload = await CloudinaryService.upload(pdf);
        await createDownloadedStudentsReport({
          institutionId,
          downloadedById: user.id,
          reportData: {
            asset: fileUpload,
            studentId,
            classroomId,
            timePeriods: body.timePeriods,
            advancementByCore: body.advancementByCore,
          },
        })
        return res.status(200).json(fileUpload);
      } catch (e) {
        console.error(e)
        return res.status(500).end();
      }
    }
  }
};
