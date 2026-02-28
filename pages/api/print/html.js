import { getServerSession } from "next-auth";
import PuppeteerService from "services/PuppeteerService";
import { authOptions } from "../auth/[...nextauth]";

export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end();
  }

  if (req.method === 'POST') {
    const puppeteerService = new PuppeteerService();
    const pdf = await puppeteerService.pdfFromHtmlAsBuffer(req.body.html);
    res.send(pdf);
  }
}