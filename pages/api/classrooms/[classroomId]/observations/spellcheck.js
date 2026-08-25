import { getObservationsByClass } from 'db/observation';
import { checkText } from 'services/spellcheck';
import { classroomNameWords } from 'services/spellcheck/classroomNames';
import { authOptions } from 'pages/api/auth/[...nextauth]'
import { getServerSession } from "next-auth/next"
import { classroomAuthorization } from 'pages/api/auth/authorizations';

export default async (req, res) => {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).end();

  const { query: { classroomId, startDate, endDate } } = req;
  const authorized = await classroomAuthorization(session.user, classroomId);
  if (!authorized) return res.status(403).end();

  if (req.method !== 'GET') return res.status(405).end();

  const [observations, rosterWords] = await Promise.all([
    getObservationsByClass(classroomId, { startDate, endDate }),
    classroomNameWords(classroomId),
  ]);
  // The full classroom roster covers children mentioned but not tagged in an
  // observation; tagged teachers may come from outside the classroom's staff.
  const customWords = [
    ...rosterWords,
    ...observations.flatMap((observation) => [observation.teacher?.firstName, observation.teacher?.lastName]),
  ].filter(Boolean);

  const results = await Promise.all(observations.map(async (observation) => {
    const words = await checkText(observation.description || '', customWords);
    return { id: observation.id, words };
  }));

  res.status(200).json({ data: results.filter((result) => result.words.length > 0) });
};
