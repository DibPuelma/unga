-- CreateTable
CREATE TABLE "InstitutionCalendarEvents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDay" DATE NOT NULL,
    "endDay" DATE NOT NULL,
    "shouldShowInCalendar" BOOLEAN NOT NULL DEFAULT true,
    "institutionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionCalendarEvents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionCalendarEvents_institutionId_idx" ON "InstitutionCalendarEvents"("institutionId");

-- CreateIndex
CREATE INDEX "InstitutionCalendarEvents_startDay_endDay_idx" ON "InstitutionCalendarEvents"("startDay", "endDay");

-- AddForeignKey
ALTER TABLE "InstitutionCalendarEvents" ADD CONSTRAINT "InstitutionCalendarEvents_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
