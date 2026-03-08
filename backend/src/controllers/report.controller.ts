import { Request, Response } from "express";
import { ReportService } from "../services/report.service";
import { AuthRequest } from "../middleware/auth";
import prisma from "../config/database";
import { CloudinaryService } from "../services/cloudinary.service";

export class ReportController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const report = await ReportService.create({
        ...req.body,
        reporterId: req.user?.id,
      });
      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to create report" });
    }
  }

  static async findAll(req: Request, res: Response) {
    try {
      const result = await ReportService.findAll(req.query as any);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  }

  static async findById(req: Request, res: Response) {
    try {
      const report = await ReportService.findById(req.params.id);
      res.json(report);
    } catch (error: any) {
      if (error.message === "Report not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch report" });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { status, notes } = req.body;
      const report = await ReportService.updateStatus(
        req.params.id,
        status,
        req.user!.id,
        notes,
      );
      res.json(report);
    } catch (error: any) {
      if (error.message === "Report not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update status" });
    }
  }

  static async assignWorker(req: AuthRequest, res: Response) {
    try {
      const { assignedToId } = req.body;
      const report = await ReportService.assignWorker(
        req.params.id,
        assignedToId,
        req.user!.id,
      );
      res.json(report);
    } catch (error: any) {
      if (
        error.message === "Report not found" ||
        error.message === "Invalid field worker"
      ) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to assign worker" });
    }
  }

  static async getMyReports(req: AuthRequest, res: Response) {
    try {
      const result = await ReportService.getMyReports(
        req.user!.id,
        req.query as any,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  }

  static async getAssignedReports(req: AuthRequest, res: Response) {
    try {
      const result = await ReportService.getAssignedReports(
        req.user!.id,
        req.query as any,
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch assigned reports" });
    }
  }

  static async getMapData(req: Request, res: Response) {
    try {
      const reports = await ReportService.getMapData(req.query as any);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch map data" });
    }
  }

  static async getHeatmapData(req: Request, res: Response) {
    try {
      const data = await ReportService.getHeatmapData();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
  }

  static async deleteReport(req: AuthRequest, res: Response) {
    try {
      await ReportService.softDelete(req.params.id);
      res.json({ message: "Report deleted successfully" });
    } catch (error: any) {
      if (error.message === "Report not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete report" });
    }
  }

  static async addImages(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const report = await prisma.report.findUnique({ where: { id } });
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      const uploadPromises = files.map(async (file) => {
        const result = await CloudinaryService.uploadImage(file.buffer);
        return prisma.reportImage.create({
          data: {
            reportId: id,
            imageUrl: result.url,
            publicId: result.publicId,
            type: req.body.type || "REPORT",
          },
        });
      });

      const images = await Promise.all(uploadPromises);
      res.status(201).json(images);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to upload images" });
    }
  }
}
