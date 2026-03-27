/*
  Warnings:

  - You are about to drop the column `user_id` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `energy_goals` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `energy_scores` table. All the data in the column will be lost.
  - You are about to drop the column `night_threshold` on the `preferences` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `preferences` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `tips` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_achievements` table. All the data in the column will be lost.
  - You are about to drop the column `last_given_tips` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[home_id,date]` on the table `energy_scores` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[home_id]` on the table `preferences` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `home_id` to the `alerts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_id` to the `energy_goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_id` to the `energy_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_id` to the `preferences` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_id` to the `tips` table without a default value. This is not possible if the table is not empty.
  - Added the required column `home_id` to the `user_achievements` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "alerts" DROP CONSTRAINT "alerts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "energy_goals" DROP CONSTRAINT "energy_goals_user_id_fkey";

-- DropForeignKey
ALTER TABLE "energy_scores" DROP CONSTRAINT "energy_scores_user_id_fkey";

-- DropForeignKey
ALTER TABLE "preferences" DROP CONSTRAINT "preferences_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tips" DROP CONSTRAINT "tips_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_achievements" DROP CONSTRAINT "user_achievements_user_id_fkey";

-- AlterTable
ALTER TABLE "alerts" DROP COLUMN "user_id",
ADD COLUMN     "home_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "energy_goals" DROP COLUMN "user_id",
ADD COLUMN     "home_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "energy_scores" DROP COLUMN "user_id",
ADD COLUMN     "home_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "preferences" DROP COLUMN "night_threshold",
DROP COLUMN "user_id",
ADD COLUMN     "home_id" UUID NOT NULL,
ADD COLUMN     "nightThreshold" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tips" DROP COLUMN "user_id",
ADD COLUMN     "home_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "user_achievements" DROP COLUMN "user_id",
ADD COLUMN     "home_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "last_given_tips";

-- CreateIndex
CREATE UNIQUE INDEX "energy_scores_home_id_date_key" ON "energy_scores"("home_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "preferences_home_id_key" ON "preferences"("home_id");

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_goals" ADD CONSTRAINT "energy_goals_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy_scores" ADD CONSTRAINT "energy_scores_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tips" ADD CONSTRAINT "tips_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "homes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
