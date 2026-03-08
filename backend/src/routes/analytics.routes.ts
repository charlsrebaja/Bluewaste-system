import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.get(
  "/overview",
  authenticate,
  authorize("LGU_ADMIN"),
  AnalyticsController.getOverview,
);
router.get(
  "/trends",
  authenticate,
  authorize("LGU_ADMIN"),
  AnalyticsController.getTrends,
);
router.get(
  "/categories",
  authenticate,
  authorize("LGU_ADMIN"),
  AnalyticsController.getCategoryDistribution,
);
router.get(
  "/barangays",
  authenticate,
  authorize("LGU_ADMIN"),
  AnalyticsController.getBarangayStats,
);
router.get(
  "/export",
  authenticate,
  authorize("LGU_ADMIN"),
  AnalyticsController.exportData,
);

export default router;
