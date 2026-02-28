/*
  Warnings:

  - You are about to drop the column `kidsbookId` on the `Classes` table. All the data in the column will be lost.
  - You are about to drop the column `kidsbookId` on the `Institutions` table. All the data in the column will be lost.
  - You are about to drop the column `kidsbookId` on the `Levels` table. All the data in the column will be lost.
  - You are about to drop the column `kidsbookId` on the `Students` table. All the data in the column will be lost.
  - You are about to drop the column `kidsbookId` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Classes_kidsbookId_levelId_idx";

-- DropIndex
DROP INDEX "Institutions_kidsbookId_idx";

-- DropIndex
DROP INDEX "Institutions_kidsbookId_key";

-- DropIndex
DROP INDEX "Levels_kidsbookId_idx";

-- DropIndex
DROP INDEX "Levels_kidsbookId_key";

-- DropIndex
DROP INDEX "Students_kidsbookId_idx";

-- DropIndex
DROP INDEX "Students_kidsbookId_key";

-- DropIndex
DROP INDEX "users_kidsbookId_idx";

-- DropIndex
DROP INDEX "users_kidsbookId_key";

-- AlterTable
ALTER TABLE "Activities" ADD COLUMN     "publiclyAvailable" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "Classes" DROP COLUMN "kidsbookId";

-- AlterTable
ALTER TABLE "Institutions" DROP COLUMN "kidsbookId";

-- AlterTable
ALTER TABLE "Levels" DROP COLUMN "kidsbookId";

-- AlterTable
ALTER TABLE "Students" DROP COLUMN "kidsbookId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "kidsbookId";
