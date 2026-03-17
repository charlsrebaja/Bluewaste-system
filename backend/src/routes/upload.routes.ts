import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth";
import { upload, validateUploadedImages } from "../middleware/upload";
import { uploadLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post(
  "/",
  authenticate,
  uploadLimiter,
  upload.single("image"),
  validateUploadedImages,
  UploadController.uploadImage,
);
router.delete("/:publicId", authenticate, UploadController.deleteImage);

export default router;
