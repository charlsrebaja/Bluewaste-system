import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.get(
  "/field-workers",
  authenticate,
  authorize("LGU_ADMIN"),
  UserController.getFieldWorkers,
);
router.get(
  "/",
  authenticate,
  authorize("LGU_ADMIN"),
  UserController.getAllUsers,
);

export default router;
