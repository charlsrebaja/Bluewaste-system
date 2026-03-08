import { Request, Response } from "express";
import prisma from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { Role } from "@prisma/client";
import {
  getPaginationParams,
  buildPaginatedResponse,
} from "../utils/pagination";

export class UserController {
  static async getFieldWorkers(req: AuthRequest, res: Response) {
    try {
      const workers = await prisma.user.findMany({
        where: { role: Role.FIELD_WORKER, isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          barangay: { select: { id: true, name: true } },
          _count: { select: { assignedReports: true } },
        },
        orderBy: { firstName: "asc" },
      });
      res.json(workers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch field workers" });
    }
  }

  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const pagination = getPaginationParams(req.query as any);
      const roleFilter = req.query.role as string | undefined;

      const where: any = {};
      if (roleFilter) where.role = roleFilter;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            isActive: true,
            barangay: { select: { id: true, name: true } },
            createdAt: true,
            _count: { select: { reports: true, assignedReports: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit,
        }),
        prisma.user.count({ where }),
      ]);

      res.json(buildPaginatedResponse(users, total, pagination));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
}
