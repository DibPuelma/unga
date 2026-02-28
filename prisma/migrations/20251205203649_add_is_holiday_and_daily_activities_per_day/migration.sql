-- AlterTable
ALTER TABLE "Classes" ADD COLUMN     "dailyActivitiesPerDay" INTEGER;

-- AlterTable
ALTER TABLE "InstitutionCalendarEvents" ADD COLUMN     "isHoliday" BOOLEAN NOT NULL DEFAULT false;
