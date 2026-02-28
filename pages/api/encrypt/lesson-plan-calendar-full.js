import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { encrypt } from 'services/crypto';

export default async (req, res) => {
  const { user: { classrooms } } = await getServerSession(req, res, authOptions);
  const { classroomId, startDate, endDate, institutionId, fontSizeMultiplier, uniqueFontSize } = req.query;
  if (!classrooms.includes(classroomId)) return res.status(403).end();

  const textToEncrypt = JSON.stringify({
    institutionId,
    classroomId,
    startDate,
    endDate,
    fontSizeMultiplier,
    uniqueFontSize,
    today: new Date().toISOString(),
  });
  const encryptedText = encrypt(textToEncrypt, 'unga');
  return res.status(200).json({
    keyIV: encryptedText.iv,
    keyContent: encryptedText.content,
  });
};