import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { UploadValidationError } from "./upload";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Error:", err.message);

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Prisma errors
  if (err.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({ error: "Database operation failed." });
  }

  if (err.name === "PrismaClientValidationError") {
    return res.status(400).json({ error: "Invalid data provided." });
  }

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File is too large. Maximum size is 5MB." });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res
        .status(400)
        .json({ error: "Too many files uploaded. Maximum is 5 files." });
    }

    return res.status(400).json({ error: "Invalid upload request." });
  }

  if (err instanceof UploadValidationError) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: "Internal server error." });
};
