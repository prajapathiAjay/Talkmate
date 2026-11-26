import express from "express";
import { messageFileUpload } from "./cloudinary.controller.js";
import { uploadMessageFiles } from "../../middlewares/upload.js";
import { authMiddleware } from "../../middlewares/auth.js";

const cloudinaryRouter = express.Router();

cloudinaryRouter
  .route("/messages")
  .post(authMiddleware, uploadMessageFiles, messageFileUpload);

export default cloudinaryRouter;
