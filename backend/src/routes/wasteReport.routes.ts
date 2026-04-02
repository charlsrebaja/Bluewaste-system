import { Router } from "express";
import { WasteReportController } from "../controllers/wasteReport.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createWasteReportSchema,
  wasteReportFilterSchema,
} from "../validators/wasteReport.validator";

const router = Router();

router.post(
  "/",
  authenticate,
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
