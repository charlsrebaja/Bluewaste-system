import multer from "multer";
import path from "path";
import { Request, Response, NextFunction } from "express";

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

const ALLOWED_FILE_TYPES = /jpeg|jpg|png|gif|webp/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const extname = ALLOWED_FILE_TYPES.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = ALLOWED_FILE_TYPES.test(file.mimetype.split("/")[1]);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new UploadValidationError(
        "Only image files (jpeg, jpg, png, gif, webp) are allowed.",
      ),
    );
  }
};

const detectImageType = (
  buffer: Buffer,
): "jpeg" | "png" | "gif" | "webp" | null => {
  if (buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return "gif";
  }

  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
};

const getFilesFromRequest = (req: Request): Express.Multer.File[] => {
  if (req.file) {
    return [req.file];
  }

  if (Array.isArray(req.files)) {
    return req.files;
  }

  return [];
};

export const validateUploadedImages = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const files = getFilesFromRequest(req);

  if (files.length === 0) {
    return next();
  }

  const invalidFile = files.find((file) => !detectImageType(file.buffer));

  if (invalidFile) {
    return next(
      new UploadValidationError(
        "Invalid image content detected. Only JPEG, PNG, GIF, and WEBP files are allowed.",
      ),
    );
  }

  next();
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});
