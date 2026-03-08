import { Request, Response } from "express";
import { CloudinaryService } from "../services/cloudinary.service";
import { AuthRequest } from "../middleware/auth";

export class UploadController {
  static async uploadImage(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await CloudinaryService.uploadImage(req.file.buffer);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to upload image" });
    }
  }

  static async deleteImage(req: AuthRequest, res: Response) {
    try {
      const { publicId } = req.params;
      await CloudinaryService.deleteImage(publicId);
      res.json({ message: "Image deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to delete image" });
    }
  }
}
