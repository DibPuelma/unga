import PlansService from "services/PlansService";

export default async (req, res) => {
  try {
    await PlansService.endExpiredTrials();
    res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
 
}