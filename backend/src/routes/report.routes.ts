import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createReportSchema,
  updateStatusSchema,
  assignWorkerSchema,
  reportFilterSchema,
  mapFilterSchema,
  heatmapFilterSchema,
} from "../validators/report.validator";
import { upload, validateUploadedImages } from "../middleware/upload";

const router = Router();

// Public / optional auth routes
router.get(
  "/",
  validate(reportFilterSchema, "query"),
  ReportController.findAll,
);
router.get(
  "/map",
  validate(mapFilterSchema, "query"),
  ReportController.getMapData,
);
router.get(
  "/heatmap",
  validate(heatmapFilterSchema, "query"),
  ReportController.getHeatmapData,
);

// Authenticated routes
router.post(
  "/",
  authenticate,
  validate(createReportSchema),
  ReportController.create,
);
router.get("/my-reports", authenticate, ReportController.getMyReports);
router.get(
  "/assigned",
  authenticate,
  authorize("FIELD_WORKER"),
  ReportController.getAssignedReports,
);

// Single report routes
router.get("/:id", ReportController.findById);

// Admin / Field Worker actions
router.put(
  "/:id/status",
  authenticate,
  authorize("LGU_ADMIN", "FIELD_WORKER"),
  validate(updateStatusSchema),
  ReportController.updateStatus,
);
router.put(
  "/:id/assign",
  authenticate,
  authorize("LGU_ADMIN"),
  validate(assignWorkerSchema),
  ReportController.assignWorker,
);
router.delete(
  "/:id",
  authenticate,
  authorize("LGU_ADMIN"),
  ReportController.deleteReport,
);

// Image upload
router.post(
  "/:id/images",
  authenticate,
  upload.array("images", 5),
  validateUploadedImages,
  ReportController.addImages,
);

export default router;
