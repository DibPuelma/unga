import crypto from 'crypto';
import prisma from 'lib/prisma';

// Replicates NextAuth v4's EmailProvider verification token flow
// (`hashToken` in next-auth/core/lib/utils) so the resulting link is
// consumed by the existing /api/auth/callback/email route.
export const generateMagicLoginUrl = async ({ email, callbackUrl, maxAgeDays = 30 }) => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(`${token}${process.env.NEXTAUTH_SECRET}`)
    .digest('hex');
  const expires = new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  });

  const params = new URLSearchParams({ callbackUrl, token, email });
  return `${process.env.NEXTAUTH_URL}/api/auth/callback/email?${params}`;
};
