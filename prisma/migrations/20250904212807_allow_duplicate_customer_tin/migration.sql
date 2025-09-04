-- Drop unique index on Customer.tinNumber to allow duplicates
-- Safe on PostgreSQL: Prisma created it as a unique index named "Customer_tinNumber_key"

DROP INDEX IF EXISTS "Customer_tinNumber_key";

-- Optional: add a non-unique index for query performance on tinNumber
CREATE INDEX IF NOT EXISTS "Customer_tinNumber_idx" ON "Customer" ("tinNumber");
