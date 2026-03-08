import multer from "multer";
import path from "path";

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
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed."));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});
