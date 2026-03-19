import { Router } from "express";
import { WasteReportController } from "../controllers/wasteReport.controller";
import { authenticate, optionalAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createWasteReportSchema,
  wasteReportFilterSchema,
} from "../validators/wasteReport.validator";

const router = Router();

router.post(
  "/",
  optionalAuth,
  validate(createWasteReportSchema),
  WasteReportController.create,
);

router.get(
  "/my-reports",
  authenticate,
  validate(wasteReportFilterSchema, "query"),
  WasteReportController.getMyReports,
);

export default router;
