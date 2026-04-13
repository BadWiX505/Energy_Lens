-- Remove icon_name column and add image_urls (text array) to tips table

ALTER TABLE "tips" DROP COLUMN IF EXISTS "icon_name";
ALTER TABLE "tips" ADD COLUMN IF NOT EXISTS "image_urls" TEXT[] NOT NULL DEFAULT '{}';
