-- =============================================
-- Migration: gamification_schema
-- =============================================

-- AlterTable: achievements
ALTER TABLE "achievements"
  ADD COLUMN IF NOT EXISTS "lucide_icon_name" TEXT,
  ADD COLUMN IF NOT EXISTS "score_value" INTEGER,
  ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN DEFAULT false;

-- AlterTable: energy_goals (drop old column if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='energy_goals' AND column_name='daily_limit_kwh') THEN
    ALTER TABLE "energy_goals" DROP COLUMN "daily_limit_kwh";
  END IF;
END $$;

ALTER TABLE "energy_goals"
  ADD COLUMN IF NOT EXISTS "label" TEXT,
  ADD COLUMN IF NOT EXISTS "last_awarded_period" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';

ALTER TABLE "energy_goals" ADD COLUMN IF NOT EXISTS "type" TEXT;
UPDATE "energy_goals" SET "type" = 'daily' WHERE "type" IS NULL;
ALTER TABLE "energy_goals" ALTER COLUMN "type" SET NOT NULL;

ALTER TABLE "energy_goals" ADD COLUMN IF NOT EXISTS "targetMetric" TEXT;
UPDATE "energy_goals" SET "targetMetric" = 'energy' WHERE "targetMetric" IS NULL;
ALTER TABLE "energy_goals" ALTER COLUMN "targetMetric" SET NOT NULL;

ALTER TABLE "energy_goals" ADD COLUMN IF NOT EXISTS "targetValue" DOUBLE PRECISION;
UPDATE "energy_goals" SET "targetValue" = 0 WHERE "targetValue" IS NULL;
ALTER TABLE "energy_goals" ALTER COLUMN "targetValue" SET NOT NULL;

-- AlterTable: energy_scores
ALTER TABLE "energy_scores"
  ADD COLUMN IF NOT EXISTS "type" TEXT,
  ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN DEFAULT false;

-- AlterTable: homes
ALTER TABLE "homes"
  ADD COLUMN IF NOT EXISTS "total_score" INTEGER;

-- AlterTable: user_achievements
ALTER TABLE "user_achievements"
  ADD COLUMN IF NOT EXISTS "is_read" BOOLEAN NOT NULL DEFAULT false;

-- Unique index: goals per home+type+metric
CREATE UNIQUE INDEX IF NOT EXISTS "energy_goals_home_id_type_targetMetric_key"
  ON "energy_goals"("home_id", "type", "targetMetric");

-- Unique index: user achievements per home+achievement
CREATE UNIQUE INDEX IF NOT EXISTS "user_achievements_home_id_achievement_id_key"
  ON "user_achievements"("home_id", "achievement_id");

-- Seed achievements
INSERT INTO "achievements" ("id", "name", "description", "lucide_icon_name", "score_value", "is_read")
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'First Step',      'Create your first energy goal',          'Target',        10, false),
  ('a1000000-0000-0000-0000-000000000002', 'Score Starter',   'Earn your very first score point',       'Trophy',        15, false),
  ('a1000000-0000-0000-0000-000000000003', 'Triple Threat',   'Have 3 or more active goals at once',    'Star',          25, false),
  ('a1000000-0000-0000-0000-000000000004', 'Weekly Warrior',  'Set a weekly energy goal',               'Calendar',      30, false),
  ('a1000000-0000-0000-0000-000000000005', 'Monthly Planner', 'Set a monthly energy goal',              'CalendarRange', 40, false),
  ('a1000000-0000-0000-0000-000000000006', 'Budget Guardian', 'Set a cost-based energy goal',           'DollarSign',    30, false),
  ('a1000000-0000-0000-0000-000000000007', 'Power Tracker',   'Set a power consumption goal',           'Zap',           20, false),
  ('a1000000-0000-0000-0000-000000000008', 'Centurion',       'Reach a total score of 100 points',      'Crown',         50, false)
ON CONFLICT ("id") DO NOTHING;
