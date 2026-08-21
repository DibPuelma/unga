-- AlterTable
ALTER TABLE "users" ADD COLUMN     "finishedReferralsTour" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "finishedTour" BOOLEAN NOT NULL DEFAULT false;
