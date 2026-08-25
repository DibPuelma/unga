import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const login = async (credentials) => {
  const { email, password } = credentials;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  } catch (e) {
    return null;
  }
};

export const resetPassword = async (userId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return user;
}
