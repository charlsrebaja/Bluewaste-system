import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, NotificationController.getUserNotifications);
router.get(
  "/unread-count",
  authenticate,
  NotificationController.getUnreadCount,
);
router.put("/read-all", authenticate, NotificationController.markAllAsRead);
router.put("/:id/read", authenticate, NotificationController.markAsRead);

export default router;
