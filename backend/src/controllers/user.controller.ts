import { Request, Response } from "express";
import prisma from "../config/database";
import { AuthRequest } from "../middleware/auth";
import { Role } from "@prisma/client";
import {
  getPaginationParams,
  buildPaginatedResponse,
} from "../utils/pagination";
import { hashPassword } from "../utils/password";

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
      const search = req.query.search as string | undefined;

      const where: any = {};
      if (roleFilter) where.role = roleFilter;
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ];
      }

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

  static async createUser(req: AuthRequest, res: Response) {
    try {
      const { email, password, firstName, lastName, role, phone, barangayId } =
        req.body;

      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!Object.values(Role).includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
          phone: phone || null,
          barangayId: barangayId || null,
        },
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
      });

      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role, phone, barangayId, isActive } =
        req.body;

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "User not found" });
      }

      if (role && !Object.values(Role).includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (email && email !== existing.email) {
        const emailTaken = await prisma.user.findUnique({ where: { email } });
        if (emailTaken) {
          return res.status(409).json({ error: "Email already in use" });
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email !== undefined && { email }),
          ...(role !== undefined && { role }),
          ...(phone !== undefined && { phone }),
          ...(barangayId !== undefined && { barangayId: barangayId || null }),
          ...(isActive !== undefined && { isActive }),
        },
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
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  }

  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const requestingUserId = req.user?.id;

      if (id === requestingUserId) {
        return res
          .status(400)
          .json({ error: "Cannot delete your own account" });
      }

      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "User not found" });
      }

      await prisma.user.delete({ where: { id } });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
}
