import { Request, Response } from "express";
import prisma from "../config/database";
import { AnalyticsService } from "../services/analytics.service";

export class BarangayController {
  static async findAll(req: Request, res: Response) {
    try {
      const barangays = await prisma.barangay.findMany({
        include: {
          _count: { select: { reports: true } },
        },
        orderBy: { name: "asc" },
      });
      res.json(barangays);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch barangays" });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const stats = await AnalyticsService.getBarangayDetailedStats(
        req.params.id,
      );
      const barangay = await prisma.barangay.findUnique({
        where: { id: req.params.id },
        select: { id: true, name: true, latitude: true, longitude: true },
      });

      if (!barangay) {
        return res.status(404).json({ error: "Barangay not found" });
      }

      res.json({ ...barangay, ...stats });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch barangay stats" });
    }
  }

  static async getRanking(req: Request, res: Response) {
    try {
      const stats = await AnalyticsService.getBarangayStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch barangay ranking" });
    }
  }
}
