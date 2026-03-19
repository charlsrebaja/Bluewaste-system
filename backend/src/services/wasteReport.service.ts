import prisma from "../config/database";
import { AiWasteType, Prisma } from "@prisma/client";
import {
  getPaginationParams,
  buildPaginatedResponse,
} from "../utils/pagination";

export class WasteReportService {
  static async create(data: {
    imageUrl: string;
    detectedObject: string;
    wasteType: AiWasteType;
    confidence: number;
    labels: string[];
    latitude?: number;
    longitude?: number;
    address?: string;
    reporterId?: string;
  }) {
    return prisma.wasteReport.create({
      data: {
        imageUrl: data.imageUrl,
        detectedObject: data.detectedObject,
        wasteType: data.wasteType,
        confidence: data.confidence,
        labels: data.labels,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        reporterId: data.reporterId,
      },
      include: {
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  static async getMyReports(
    userId: string,
    filters: {
      page?: string;
      limit?: string;
    },
  ) {
    const pagination = getPaginationParams({
      page: filters.page,
      limit: filters.limit,
    });

    const where: Prisma.WasteReportWhereInput = { reporterId: userId };

    const [reports, total] = await Promise.all([
      prisma.wasteReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.wasteReport.count({ where }),
    ]);

    return buildPaginatedResponse(reports, total, pagination);
  }
}
