/*
  Warnings:

  - You are about to drop the column `message` on the `tips` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tips" DROP COLUMN "message",
ADD COLUMN     "category_tag" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "estimated_savings" TEXT,
ADD COLUMN     "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "icon_name" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "source_device_id" UUID,
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "tips_home_id_generated_at_idx" ON "tips"("home_id", "generated_at");

-- CreateIndex
CREATE INDEX "tips_home_id_created_at_idx" ON "tips"("home_id", "created_at");
