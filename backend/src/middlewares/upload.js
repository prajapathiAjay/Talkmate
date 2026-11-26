import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

export const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
const FORMAT_ERROR = "Only JPG, PNG, WebP, GIF and HEIC photos can be sent";

const isHeic = (file) => /heic|heif/i.test(file.mimetype) || /\.(heic|heif)$/i.test(file.originalname);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "talkmate-uploads",
    allowed_formats: ALLOWED_FORMATS,
    // Most browsers can't display HEIC (iPhone photos), so store those as JPG
    ...(isHeic(file) && { format: "jpg" }),
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || isHeic(file)) return cb(null, true);
    cb(Object.assign(new Error(FORMAT_ERROR), { statusCode: 400 }));
  },
});

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `Each photo must be under ${MAX_FILE_SIZE_MB} MB`,
  LIMIT_FILE_COUNT: `You can send up to ${MAX_FILES} photos at a time`,
  LIMIT_UNEXPECTED_FILE: `You can send up to ${MAX_FILES} photos at a time`,
};

// Upload a message's photos, turning upload problems into readable 400 errors
export const uploadMessageFiles = (req, res, next) => {
  upload.array("files", MAX_FILES)(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      err.statusCode = 400;
      err.message = MULTER_MESSAGES[err.code] || "Upload failed";
    } else if (err.http_code === 400) {
      // Cloudinary rejected the file, e.g. a format that isn't allowed
      err.statusCode = 400;
      err.message = FORMAT_ERROR;
    }
    next(err);
  });
};

export default upload;
