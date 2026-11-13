-- Optional photo credit (author, source and licence) for catalogue photos that need attribution.
ALTER TABLE "CatalogImage" ADD COLUMN "credit" TEXT,
ADD COLUMN "creditUrl" TEXT;
