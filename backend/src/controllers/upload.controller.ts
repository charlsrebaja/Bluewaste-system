import { Request, Response } from "express";
import { CloudinaryService } from "../services/cloudinary.service";
import { AuthRequest } from "../middleware/auth";
import prisma from "../config/database";
import { sendError } from "../utils/http";

export class UploadController {
  static async uploadImage(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return sendError(res, 400, "No file uploaded", "NO_FILE_UPLOADED");
      }

      const result = await CloudinaryService.uploadImage(req.file.buffer);
      res.status(201).json(result);
    } catch (error: any) {
      sendError(res, 500, "Failed to upload image", "IMAGE_UPLOAD_FAILED");
    }
  }

  static async deleteImage(req: AuthRequest, res: Response) {
    try {
      const { publicId } = req.params;

      const image = await prisma.reportImage.findFirst({
        where: { publicId },
        select: { id: true },
      });

      if (!image) {
        return sendError(res, 404, "Image not found", "IMAGE_NOT_FOUND");
      }

      await CloudinaryService.deleteImage(publicId);
      await prisma.reportImage.delete({ where: { id: image.id } });

      res.json({ message: "Image deleted successfully" });
    } catch (error: any) {
      sendError(res, 500, "Failed to delete image", "IMAGE_DELETE_FAILED");
    }
  }
}
