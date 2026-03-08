import prisma from "../config/database";
import { ReportStatus, Prisma } from "@prisma/client";

export class AnalyticsService {
  static async getOverview() {
    const [total, pending, verified, scheduled, inProgress, cleaned, rejected] =
      await Promise.all([
        prisma.report.count({ where: { isDeleted: false } }),
        prisma.report.count({
          where: { status: ReportStatus.PENDING, isDeleted: false },
        }),
        prisma.report.count({
          where: { status: ReportStatus.VERIFIED, isDeleted: false },
        }),
        prisma.report.count({
          where: { status: ReportStatus.CLEANUP_SCHEDULED, isDeleted: false },
        }),
        prisma.report.count({
          where: { status: ReportStatus.IN_PROGRESS, isDeleted: false },
        }),
        prisma.report.count({
          where: { status: ReportStatus.CLEANED, isDeleted: false },
        }),
        prisma.report.count({
          where: { status: ReportStatus.REJECTED, isDeleted: false },
        }),
      ]);

    return {
      total,
      pending,
      verified,
      cleanupScheduled: scheduled,
      inProgress,
      cleaned,
      rejected,
    };
  }

  static async getTrends(
    period: "daily" | "weekly" | "monthly" = "daily",
    days: number = 30,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reports = await prisma.report.findMany({
      where: {
        createdAt: { gte: startDate },
        isDeleted: false,
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    reports.forEach((report) => {
      let key: string;
      const date = new Date(report.createdAt);

      if (period === "daily") {
        key = date.toISOString().split("T")[0];
      } else if (period === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  static async getCategoryDistribution() {
    const categories = await prisma.report.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { isDeleted: false },
      orderBy: { _count: { id: "desc" } },
    });

    return categories.map((c) => ({
      category: c.category,
      count: c._count.id,
    }));
  }

  static async getBarangayStats() {
    const stats = await prisma.report.groupBy({
      by: ["barangayId"],
      _count: { id: true },
      where: { isDeleted: false, barangayId: { not: null } },
      orderBy: { _count: { id: "desc" } },
    });

    // Get barangay names
    const barangayIds = stats
      .filter((s) => s.barangayId !== null)
      .map((s) => s.barangayId as string);

    const barangays = await prisma.barangay.findMany({
      where: { id: { in: barangayIds } },
      select: { id: true, name: true },
    });

    const barangayMap = new Map(barangays.map((b) => [b.id, b.name]));

    return stats.map((s) => ({
      barangayId: s.barangayId,
      barangayName: barangayMap.get(s.barangayId!) || "Unknown",
      count: s._count.id,
    }));
  }

  static async getBarangayDetailedStats(barangayId: string) {
    const [total, byStatus, byCategory] = await Promise.all([
      prisma.report.count({ where: { barangayId, isDeleted: false } }),
      prisma.report.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { barangayId, isDeleted: false },
      }),
      prisma.report.groupBy({
        by: ["category"],
        _count: { id: true },
        where: { barangayId, isDeleted: false },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
    };
  }

  static async exportData(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    barangayId?: string;
  }) {
    const where: Prisma.ReportWhereInput = { isDeleted: false };

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    if (filters?.status) where.status = filters.status as ReportStatus;
    if (filters?.barangayId) where.barangayId = filters.barangayId;

    return prisma.report.findMany({
      where,
      include: {
        reporter: { select: { firstName: true, lastName: true, email: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        barangay: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
