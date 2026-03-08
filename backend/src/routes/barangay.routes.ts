import { Router } from "express";
import { BarangayController } from "../controllers/barangay.controller";

const router = Router();

router.get("/", BarangayController.findAll);
router.get("/ranking", BarangayController.getRanking);
router.get("/:id/stats", BarangayController.getStats);

export default router;
