import BumperEmailsService from "services/email/BumpersService";

export default async (req, res) => {
  try {
    await BumperEmailsService.sendDownloadReportsExplanationToTrialUsers();
    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
 
}