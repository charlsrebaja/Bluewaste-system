import prisma from "../config/database";
import { ReportStatus, WasteCategory, Prisma } from "@prisma/client";
import {
  getPaginationParams,
  buildPaginatedResponse,
  PaginationParams,
} from "../utils/pagination";
import { NotificationService } from "./notification.service";

export class ReportService {
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
    const report = await prisma.report.create({
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

    // Create initial status history
    if (data.reporterId) {
      await prisma.statusHistory.create({
        data: {
          reportId: report.id,
          newStatus: ReportStatus.PENDING,
          changedById: data.reporterId,
          notes: "Report submitted",
        },
      });
    }

    // Notify LGU admins
    await NotificationService.notifyAdmins(
      "New Waste Report",
      `A new ${data.category.replace("_", " ").toLowerCase()} report has been submitted: "${data.title}"`,
      report.id,
    );

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
    const report = await prisma.report.findUnique({
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
    const report = await prisma.report.findUnique({
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

    return updatedReport;
  }

  static async assignWorker(
    reportId: string,
    assignedToId: string,
    assignedById: string,
  ) {
    const report = await prisma.report.findUnique({
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
  }) {
    const where: Prisma.ReportWhereInput = { isDeleted: false };
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.barangayId) where.barangayId = filters.barangayId;

    return prisma.report.findMany({
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
    });
  }

  static async getHeatmapData() {
    const reports = await prisma.report.findMany({
      where: { isDeleted: false, status: { not: ReportStatus.CLEANED } },
      select: {
        latitude: true,
        longitude: true,
        priority: true,
      },
    });

    return reports.map((r) => ({
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
  }

  static async softDelete(reportId: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error("Report not found");

    return prisma.report.update({
      where: { id: reportId },
      data: { isDeleted: true },
    });
  }
}
