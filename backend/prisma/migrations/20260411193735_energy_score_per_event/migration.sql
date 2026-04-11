/*
  Warnings:

  - Made the column `score` on table `energy_scores` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date` on table `energy_scores` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `energy_scores` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_read` on table `energy_scores` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "energy_scores_home_id_date_key";

-- AlterTable
ALTER TABLE "energy_scores" ADD COLUMN     "label" TEXT,
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "score" SET DEFAULT 0,
ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'goal',
ALTER COLUMN "is_read" SET NOT NULL;
