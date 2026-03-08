import { Request, Response, NextFunction } from "express";

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

  return res.status(500).json({ error: "Internal server error." });
};
