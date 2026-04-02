import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validators/user.validator";

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
  validate(createUserSchema),
  UserController.createUser,
);
router.put(
  "/:id",
  authenticate,
  authorize("LGU_ADMIN"),
  validate(userIdParamSchema, "params"),
  validate(updateUserSchema),
  UserController.updateUser,
);
router.delete(
  "/:id",
  authenticate,
  authorize("LGU_ADMIN"),
  validate(userIdParamSchema, "params"),
  UserController.deleteUser,
);

export default router;
