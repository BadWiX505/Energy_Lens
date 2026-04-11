-- Goals duration + endDate, fix Home.totalScore NULL bug

-- 1. Fix homes.total_score: NULL → 0, then NOT NULL
UPDATE "homes" SET "total_score" = 0 WHERE "total_score" IS NULL;
ALTER TABLE "homes" ALTER COLUMN "total_score" SET NOT NULL;
ALTER TABLE "homes" ALTER COLUMN "total_score" SET DEFAULT 0;

-- 2. Add duration column (with default, safe)
ALTER TABLE "energy_goals" ADD COLUMN IF NOT EXISTS "duration" INTEGER NOT NULL DEFAULT 1;

-- 3. Drop old idempotency column (was replaced by status-based guard)
ALTER TABLE "energy_goals" DROP COLUMN IF EXISTS "last_awarded_period";

-- 4. Add end_date as nullable first
ALTER TABLE "energy_goals" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMPTZ;

-- 5. Backfill end_date for existing rows based on type
UPDATE "energy_goals"
SET "end_date" = CASE
  WHEN "type" = 'daily'   THEN "created_at" + INTERVAL '1 day'
  WHEN "type" = 'weekly'  THEN "created_at" + INTERVAL '7 days'
  WHEN "type" = 'monthly' THEN "created_at" + INTERVAL '30 days'
  ELSE "created_at" + INTERVAL '1 day'
END
WHERE "end_date" IS NULL;

-- 6. Now make end_date NOT NULL
ALTER TABLE "energy_goals" ALTER COLUMN "end_date" SET NOT NULL;
