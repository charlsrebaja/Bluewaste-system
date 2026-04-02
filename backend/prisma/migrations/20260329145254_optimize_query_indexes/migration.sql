-- AlterTable
ALTER TABLE "WasteReport" ALTER COLUMN "labels" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_isDeleted_createdAt_idx" ON "Report"("isDeleted", "createdAt");

-- CreateIndex
CREATE INDEX "Report_isDeleted_status_createdAt_idx" ON "Report"("isDeleted", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_isDeleted_category_createdAt_idx" ON "Report"("isDeleted", "category", "createdAt");

-- CreateIndex
CREATE INDEX "Report_isDeleted_barangayId_createdAt_idx" ON "Report"("isDeleted", "barangayId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_isDeleted_reporterId_createdAt_idx" ON "Report"("isDeleted", "reporterId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_isDeleted_assignedToId_createdAt_idx" ON "Report"("isDeleted", "assignedToId", "createdAt");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "WasteReport_reporterId_createdAt_idx" ON "WasteReport"("reporterId", "createdAt");
