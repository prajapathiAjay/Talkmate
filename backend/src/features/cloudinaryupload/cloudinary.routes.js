import express from "express";
import { messageFileUpload } from "./cloudinary.controller.js";
import upload from "../../middlewares/upload.js";
import { authMiddleware } from "../../middlewares/auth.js";

const cloudinaryRouter = express.Router();

cloudinaryRouter
  .route("/messages")
  .post(authMiddleware, upload.array("files", 5), messageFileUpload);

export default cloudinaryRouter;
