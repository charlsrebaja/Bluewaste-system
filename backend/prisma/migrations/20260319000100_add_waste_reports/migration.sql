-- CreateEnum
CREATE TYPE "AiWasteType" AS ENUM ('RECYCLABLE', 'NON_RECYCLABLE', 'ORGANIC');

-- CreateTable
CREATE TABLE "WasteReport" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "detectedObject" TEXT NOT NULL,
    "wasteType" "AiWasteType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reporterId" TEXT,

    CONSTRAINT "WasteReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WasteReport_wasteType_idx" ON "WasteReport"("wasteType");

-- CreateIndex
CREATE INDEX "WasteReport_createdAt_idx" ON "WasteReport"("createdAt");

-- CreateIndex
CREATE INDEX "WasteReport_reporterId_idx" ON "WasteReport"("reporterId");

-- AddForeignKey
ALTER TABLE "WasteReport" ADD CONSTRAINT "WasteReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
