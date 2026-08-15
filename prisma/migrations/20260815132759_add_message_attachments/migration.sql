-- AlterTable
ALTER TABLE "DirectMessage" ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileType" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileType" TEXT;
