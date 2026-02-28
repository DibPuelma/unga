import SendTeachersWeeklyStats from "commands/reports/sendTeachersWeeklyStats";
import { validateSignature } from "services/mergent/requestValidator";


export default async (req, res) => {
  if (req.method == 'POST') {
    if (!validateSignature(req.headers['x-mergent-signature'], '')) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const sender = new SendTeachersWeeklyStats();
    await sender.perform();
    res.status(200).json({ message: 'Emails sent' });
  }
};