-- AlterTable
ALTER TABLE "Product" ADD COLUMN "purpose" TEXT;
ALTER TABLE "Product" ADD COLUMN "details" TEXT;
ALTER TABLE "Product" ADD COLUMN "visualType" TEXT DEFAULT 'icon';
ALTER TABLE "Product" ADD COLUMN "iconName" TEXT;
ALTER TABLE "Product" ADD COLUMN "imageData" TEXT;
