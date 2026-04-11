-- AlterTable
ALTER TABLE "detected_appliances" ADD COLUMN     "category_id" UUID;

-- CreateTable
CREATE TABLE "detected_appliance_categories" (
    "id" UUID NOT NULL,
    "category" TEXT,

    CONSTRAINT "detected_appliance_categories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "detected_appliances" ADD CONSTRAINT "detected_appliances_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "detected_appliance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
