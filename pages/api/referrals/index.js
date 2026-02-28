import { createReferral } from "db/referral";

export default async (req, res) => {
  if (req.method === 'POST') {
    const referral = await createReferral(req.body);
    res.status(200).json(referral);
  }
};