-- Split OrderStudent.studentName into separate firstName/lastName columns.

-- 1. Add as nullable so existing rows aren't rejected.
ALTER TABLE "OrderStudent" ADD COLUMN "firstName" TEXT;
ALTER TABLE "OrderStudent" ADD COLUMN "lastName" TEXT;

-- 2. Backfill from the existing combined name: first word -> firstName,
-- remainder -> lastName (empty string if there was no space).
UPDATE "OrderStudent"
SET
  "firstName" = CASE
    WHEN position(' ' in "studentName") = 0 THEN "studentName"
    ELSE split_part("studentName", ' ', 1)
  END,
  "lastName" = CASE
    WHEN position(' ' in "studentName") = 0 THEN ''
    ELSE trim(substring("studentName" from position(' ' in "studentName") + 1))
  END;

-- 3. Now that every row is backfilled, enforce NOT NULL.
ALTER TABLE "OrderStudent" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "OrderStudent" ALTER COLUMN "lastName" SET NOT NULL;

-- 4. Drop the old combined column.
ALTER TABLE "OrderStudent" DROP COLUMN "studentName";
