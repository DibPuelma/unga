import { getObservation } from 'db/observation';
import { checkText } from 'services/spellcheck';
import { classroomNameWords } from 'services/spellcheck/classroomNames';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from 'pages/api/auth/authorizations';

export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).end();

  if (req.method !== 'GET') return res.status(405).end();

  const { query: { observationId } } = req;
  const observation = await getObservation(observationId);
  if (!observation) return res.status(404).end();

  const authorized = await classroomAuthorization(session.user, observation.classroomId);
  if (!authorized) return res.status(403).end();

  // The full classroom roster covers children mentioned but not tagged in the
  // observation; the tagged teacher may come from outside the classroom's staff.
  const customWords = [
    ...(await classroomNameWords(observation.classroomId)),
    observation.teacher?.firstName,
    observation.teacher?.lastName,
  ].filter(Boolean);

  const words = await checkText(observation.description || '', customWords);
  res.status(200).json({ words });
};
