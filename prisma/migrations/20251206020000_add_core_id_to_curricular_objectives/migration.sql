-- Step 1: Add coreId as nullable first
ALTER TABLE "CurricularObjectives" ADD COLUMN "coreId" TEXT;

-- Step 2: Populate coreId based on usage in Objectives
-- Assign curricular objectives to cores based on which cores use them through objectives
UPDATE "CurricularObjectives" co
SET "coreId" = (
  SELECT DISTINCT o."coreId"
  FROM "Objectives" o
  WHERE o."curricularObjectiveId" = co.id
  LIMIT 1
)
WHERE "coreId" IS NULL;

-- If still null, try SubObjectives
UPDATE "CurricularObjectives" co
SET "coreId" = (
  SELECT DISTINCT so."coreId"
  FROM "SubObjectives" so
  WHERE so."curricularObjectiveId" = co.id
  LIMIT 1
)
WHERE "coreId" IS NULL;

-- Step 3: Delete any curricular objectives that couldn't be assigned to a core
DELETE FROM "CurricularObjectives" WHERE "coreId" IS NULL;

-- Step 4: Create index
CREATE INDEX "CurricularObjectives_coreId_idx" ON "CurricularObjectives"("coreId");

-- Step 5: Add foreign key constraint
ALTER TABLE "CurricularObjectives" ADD CONSTRAINT "CurricularObjectives_coreId_fkey" FOREIGN KEY ("coreId") REFERENCES "Cores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Make coreId required
ALTER TABLE "CurricularObjectives" ALTER COLUMN "coreId" SET NOT NULL;

