import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { WasteReportService } from "../services/wasteReport.service";

export class WasteReportController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const report = await WasteReportService.create({
        ...req.body,
        reporterId: req.user?.id,
      });

      res.status(201).json(report);
    } catch {
      res.status(500).json({ error: "Failed to create waste report" });
    }
  }

  static async getMyReports(req: AuthRequest, res: Response) {
    try {
      const result = await WasteReportService.getMyReports(
        req.user!.id,
        req.query as { page?: string; limit?: string },
      );

      res.json(result);
    } catch {
      res.status(500).json({ error: "Failed to fetch waste reports" });
    }
  }
}
