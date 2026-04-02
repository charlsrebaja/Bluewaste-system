import prisma from "../config/database";
import {
  ReportStatus,
  WasteCategory,
  Prisma,
  NotificationType,
} from "@prisma/client";
import {
  getPaginationParams,
  buildPaginatedResponse,
  PaginationParams,
} from "../utils/pagination";
import { NotificationService } from "./notification.service";

export class ReportService {
  private static readonly GEO_CACHE_TTL_MS = 20_000;

  private static mapDataCache = new Map<
    string,
    {
      expiresAt: number;
      data: any[];
    }
  >();

  private static heatmapCache: {
    expiresAt: number;
    data: Array<{ lat: number; lng: number; intensity: number }>;
  } | null = null;

  private static invalidateGeoCaches() {
    this.mapDataCache.clear();
    this.heatmapCache = null;
  }

  private static getCachedMapData(cacheKey: string) {
    const cached = this.mapDataCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      this.mapDataCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  private static setCachedMapData(cacheKey: string, data: any[]) {
    this.mapDataCache.set(cacheKey, {
      expiresAt: Date.now() + this.GEO_CACHE_TTL_MS,
      data,
    });
  }

  private static getCachedHeatmapData() {
    if (!this.heatmapCache) {
      return null;
    }

    if (this.heatmapCache.expiresAt < Date.now()) {
      this.heatmapCache = null;
      return null;
    }

    return this.heatmapCache.data;
  }

  private static setCachedHeatmapData(
    data: Array<{ lat: number; lng: number; intensity: number }>,
  ) {
    this.heatmapCache = {
      expiresAt: Date.now() + this.GEO_CACHE_TTL_MS,
      data,
    };
  }

  static async create(data: {
    title: string;
    description: string;
    category: WasteCategory;
    latitude: number;
    longitude: number;
    address?: string;
    barangayId?: string;
    isAnonymous?: boolean;
    priority?: string;
    reporterId?: string;
  }) {
    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          barangayId: data.barangayId,
          isAnonymous: data.isAnonymous || false,
          priority: (data.priority as any) || "MEDIUM",
          reporterId: data.isAnonymous ? null : data.reporterId,
        },
        include: {
          reporter: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          barangay: { select: { id: true, name: true } },
          images: true,
        },
      });

      if (data.reporterId) {
        await tx.statusHistory.create({
          data: {
            reportId: created.id,
            newStatus: ReportStatus.PENDING,
            changedById: data.reporterId,
            notes: "Report submitted",
          },
        });
      }

      return created;
    });

    try {
      await NotificationService.notifyAdmins(
        "New Waste Report",
        `A new ${data.category.replace("_", " ").toLowerCase()} report has been submitted: "${data.title}"`,
        report.id,
      );
    } catch (error) {
      console.warn("Failed to notify admins for new report:", report.id, error);
    }

    this.invalidateGeoCaches();

    return report;
  }

  static async findAll(filters: {
    status?: ReportStatus;
    category?: WasteCategory;
    barangayId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    const pagination = getPaginationParams({
      page: filters.page,
      limit: filters.limit,
    });

    const where: Prisma.ReportWhereInput = {
      isDeleted: false,
    };

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.barangayId) where.barangayId = filters.barangayId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { address: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, firstName: true, lastName: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true },
          },
          barangay: { select: { id: true, name: true } },
          images: { take: 1 },
          _count: { select: { images: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.report.count({ where }),
    ]);

    return buildPaginatedResponse(reports, total, pagination);
  }

  static async findById(id: string) {
    const report = await prisma.report.findFirst({
      where: { id, isDeleted: false },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        barangay: { select: { id: true, name: true } },
        images: { orderBy: { createdAt: "asc" } },
        statusHistory: {
          include: {
            changedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    return report;
  }

  static async updateStatus(
    reportId: string,
    status: ReportStatus,
    changedById: string,
    notes?: string,
  ) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, isDeleted: false },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    const [updatedReport] = await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: { status },
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true } },
          barangay: { select: { id: true, name: true } },
          images: { take: 1 },
        },
      }),
      prisma.statusHistory.create({
        data: {
          reportId,
          previousStatus: report.status,
          newStatus: status,
          changedById,
          notes,
        },
      }),
    ]);

    // Notify report creator about status change (if not anonymous)
    if (report.reporterId) {
      await NotificationService.create({
        userId: report.reporterId,
        title: "Report Status Updated",
        message: `Your report "${report.title}" status changed to ${status.replace("_", " ")}`,
        type: "STATUS_CHANGE",
        reportId,
      });
    }

    // Notify admins when field worker marks report as cleaned
    if (status === ReportStatus.CLEANED) {
      const barangayInfo = updatedReport.barangay
        ? ` in ${updatedReport.barangay.name}`
        : "";
      const locationInfo = report.address
        ? ` (${report.address})`
        : barangayInfo;

      await NotificationService.notifyAdmins(
        "Report Completed",
        `Report "${updatedReport.title}" has been marked as cleaned${locationInfo}. Cleanup completed at ${new Date().toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}.`,
        reportId,
        NotificationType.STATUS_CHANGE,
      );
    }

    this.invalidateGeoCaches();

    return updatedReport;
  }

  static async assignWorker(
    reportId: string,
    assignedToId: string,
    assignedById: string,
  ) {
    const report = await prisma.report.findFirst({
      where: { id: reportId, isDeleted: false },
    });

    if (!report) {
      throw new Error("Report not found");
    }

    // Verify worker exists and is a field worker
    const worker = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!worker || worker.role !== "FIELD_WORKER") {
      throw new Error("Invalid field worker");
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { assignedToId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        barangay: { select: { id: true, name: true } },
      },
    });

    // Notify assigned worker
    await NotificationService.create({
      userId: assignedToId,
      title: "New Assignment",
      message: `You have been assigned to report: "${report.title}"`,
      type: "ASSIGNMENT",
      reportId,
    });

    return updatedReport;
  }

  static async getMyReports(
    userId: string,
    filters: { page?: string; limit?: string; status?: ReportStatus },
  ) {
    const pagination = getPaginationParams({
      page: filters.page,
      limit: filters.limit,
    });

    const where: Prisma.ReportWhereInput = {
      reporterId: userId,
      isDeleted: false,
    };
    if (filters.status) where.status = filters.status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          barangay: { select: { id: true, name: true } },
          images: { take: 1 },
          _count: { select: { images: true, statusHistory: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.report.count({ where }),
    ]);

    return buildPaginatedResponse(reports, total, pagination);
  }

  static async getAssignedReports(
    userId: string,
    filters: { page?: string; limit?: string; status?: ReportStatus },
  ) {
    const pagination = getPaginationParams({
      page: filters.page,
      limit: filters.limit,
    });

    const where: Prisma.ReportWhereInput = {
      assignedToId: userId,
      isDeleted: false,
    };
    if (filters.status) where.status = filters.status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true } },
          barangay: { select: { id: true, name: true } },
          images: { take: 1 },
          _count: { select: { images: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.report.count({ where }),
    ]);

    return buildPaginatedResponse(reports, total, pagination);
  }

  static async getMapData(filters?: {
    status?: ReportStatus;
    category?: WasteCategory;
    barangayId?: string;
    limit?: string;
  }) {
    const parsedLimit = Number.parseInt(filters?.limit || "", 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 5000)
      : 2000;

    const cacheKey = JSON.stringify({
      status: filters?.status || null,
      category: filters?.category || null,
      barangayId: filters?.barangayId || null,
      limit,
    });

    const cached = this.getCachedMapData(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Prisma.ReportWhereInput = { isDeleted: false };
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.barangayId) where.barangayId = filters.barangayId;

    const reports = await prisma.report.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        priority: true,
        latitude: true,
        longitude: true,
        address: true,
        createdAt: true,
        barangay: { select: { id: true, name: true } },
        images: { take: 1, select: { imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    this.setCachedMapData(cacheKey, reports);

    return reports;
  }

  static async getHeatmapData(filters?: { limit?: string }) {
    const cached = this.getCachedHeatmapData();
    if (cached) {
      return cached;
    }

    const parsedLimit = Number.parseInt(filters?.limit || "", 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 10000)
      : 5000;

    const reports = await prisma.report.findMany({
      where: { isDeleted: false, status: { not: ReportStatus.CLEANED } },
      select: {
        latitude: true,
        longitude: true,
        priority: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const heatmapData = reports.map((r) => ({
      lat: r.latitude,
      lng: r.longitude,
      intensity:
        r.priority === "CRITICAL"
          ? 1.0
          : r.priority === "HIGH"
            ? 0.75
            : r.priority === "MEDIUM"
              ? 0.5
              : 0.25,
    }));

    this.setCachedHeatmapData(heatmapData);

    return heatmapData;
  }

  static async softDelete(reportId: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error("Report not found");

    const deletedReport = await prisma.report.update({
      where: { id: reportId },
      data: { isDeleted: true },
    });

    this.invalidateGeoCaches();

    return deletedReport;
  }
}
