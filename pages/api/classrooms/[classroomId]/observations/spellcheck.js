import { getObservationsByClass } from 'db/observation';
import { checkText } from 'services/spellcheck';
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

  const observations = await getObservationsByClass(classroomId, { startDate, endDate });
  const customWords = observations.flatMap((observation) => ([
    ...(observation.students || []).flatMap((student) => [student.firstName, student.lastName]),
    observation.teacher?.firstName,
    observation.teacher?.lastName,
  ])).filter(Boolean);

  const results = await Promise.all(observations.map(async (observation) => {
    const words = await checkText(observation.description || '', customWords);
    return { id: observation.id, words };
  }));

  res.status(200).json({ data: results.filter((result) => result.words.length > 0) });
};
