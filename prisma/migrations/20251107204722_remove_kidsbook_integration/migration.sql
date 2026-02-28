-- Drop columns if they exist (safe to run even if already removed)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kidsbookId') THEN
    ALTER TABLE "users" DROP COLUMN "kidsbookId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Institutions' AND column_name = 'kidsbookId') THEN
    ALTER TABLE "Institutions" DROP COLUMN "kidsbookId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Levels' AND column_name = 'kidsbookId') THEN
    ALTER TABLE "Levels" DROP COLUMN "kidsbookId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Classes' AND column_name = 'kidsbookId') THEN
    ALTER TABLE "Classes" DROP COLUMN "kidsbookId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Students' AND column_name = 'kidsbookId') THEN
    ALTER TABLE "Students" DROP COLUMN "kidsbookId";
  END IF;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "users_kidsbookId_key";

-- DropIndex
DROP INDEX IF EXISTS "users_kidsbookId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Institutions_kidsbookId_key";

-- DropIndex
DROP INDEX IF EXISTS "Institutions_kidsbookId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Levels_kidsbookId_key";

-- DropIndex
DROP INDEX IF EXISTS "Levels_kidsbookId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Classes_kidsbookId_levelId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Students_kidsbookId_key";

-- DropIndex
DROP INDEX IF EXISTS "Students_kidsbookId_idx";

