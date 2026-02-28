/*
  Warnings:

  - Added the required column `institutionId` to the `CurricularObjectives` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add institutionId as nullable first
ALTER TABLE "CurricularObjectives" ADD COLUMN "institutionId" TEXT;

-- Step 2: Create index
CREATE INDEX "CurricularObjectives_institutionId_idx" ON "CurricularObjectives"("institutionId");

-- Step 3: Populate institutionId based on usage in Objectives and SubObjectives
-- This assigns curricular objectives to institutions based on which institutions use them
UPDATE "CurricularObjectives" co
SET "institutionId" = (
  SELECT DISTINCT c."institutionId"
  FROM "Objectives" o
  JOIN "Cores" c ON o."coreId" = c.id
  WHERE o."curricularObjectiveId" = co.id
  LIMIT 1
)
WHERE "institutionId" IS NULL;

-- If still null, try SubObjectives
UPDATE "CurricularObjectives" co
SET "institutionId" = (
  SELECT DISTINCT so."institutionId"
  FROM "SubObjectives" so
  WHERE so."curricularObjectiveId" = co.id
  LIMIT 1
)
WHERE "institutionId" IS NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "CurricularObjectives" ADD CONSTRAINT "CurricularObjectives_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Delete any curricular objectives that couldn't be assigned to an institution
-- (since we're starting fresh, unused curricular objectives are removed)
DELETE FROM "CurricularObjectives" WHERE "institutionId" IS NULL;

-- Step 6: Make institutionId required (now that all NULLs are removed)
ALTER TABLE "CurricularObjectives" ALTER COLUMN "institutionId" SET NOT NULL;
