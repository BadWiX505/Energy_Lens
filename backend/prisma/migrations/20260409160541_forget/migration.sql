/*
  Warnings:

  - You are about to drop the `detected_appliance_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `detected_appliances` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "detected_appliances" DROP CONSTRAINT "detected_appliances_category_id_fkey";

-- DropForeignKey
ALTER TABLE "detected_appliances" DROP CONSTRAINT "detected_appliances_device_id_fkey";

-- DropTable
DROP TABLE "detected_appliance_categories";

-- DropTable
DROP TABLE "detected_appliances";
