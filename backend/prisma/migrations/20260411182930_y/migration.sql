-- AlterTable
ALTER TABLE "energy_goals" ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_achievements" ALTER COLUMN "is_read" DROP NOT NULL;
