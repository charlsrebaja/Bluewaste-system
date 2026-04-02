import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { WasteReportService } from "../services/wasteReport.service";
import { sendError } from "../utils/http";

export class WasteReportController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const report = await WasteReportService.create({
        ...req.body,
        reporterId: req.user?.id,
      });

      res.status(201).json(report);
    } catch {
      sendError(
        res,
        500,
        "Failed to create waste report",
        "WASTE_REPORT_CREATE_FAILED",
      );
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
      sendError(
        res,
        500,
        "Failed to fetch waste reports",
        "WASTE_REPORT_FETCH_FAILED",
      );
    }
  }
}
