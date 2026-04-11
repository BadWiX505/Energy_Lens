-- AddColumn rule_type to alerts table
ALTER TABLE "alerts" ADD COLUMN "rule_type" TEXT;

-- AddColumn metadata (JSON) to alerts table
ALTER TABLE "alerts" ADD COLUMN "metadata" JSONB;
