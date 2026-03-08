import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { AuthRequest } from "../middleware/auth";

export class NotificationController {
  static async getUserNotifications(req: AuthRequest, res: Response) {
    try {
      const result = await NotificationService.getUserNotifications(
        req.user!.id,
        req.query as any,
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      await NotificationService.markAsRead(req.params.id, req.user!.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  }
}
