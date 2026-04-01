-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_home_id_fkey";

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_home_id_fkey" FOREIGN KEY ("home_id") REFERENCES "homes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
