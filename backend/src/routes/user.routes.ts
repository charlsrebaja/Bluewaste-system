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
router.post(
  "/",
  authenticate,
  authorize("LGU_ADMIN"),
  UserController.createUser,
);
router.put(
  "/:id",
  authenticate,
  authorize("LGU_ADMIN"),
  UserController.updateUser,
);
router.delete(
  "/:id",
  authenticate,
  authorize("LGU_ADMIN"),
  UserController.deleteUser,
);

export default router;
