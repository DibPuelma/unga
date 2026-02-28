import {
  getInstitutionWithStructure,
  updateInstitution,
} from "db/institution";
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { institutionAuthorization } from "pages/api/auth/authorizations";

export default async (req, res) => {
  const { query: { institutionId }, body } = req;

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { user } = session;
  
  if (!(await institutionAuthorization(user, institutionId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method == 'GET') {
    try {
      const query = await getInstitutionWithStructure(institutionId);
      if (!query) return res.status(404).json({ error: 'Institution not found' });
      res.status(200).json({ ...query });
    } catch (error) {
      console.error('Error fetching institution:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method == 'PATCH') {
    const { body } = req;
    try {
      await updateInstitution(institutionId, body);
      const query = await getInstitutionWithStructure(institutionId);
      return res.status(200).json({ ...query });
    } catch (error) {
      return res.status(400).json({ error });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
};