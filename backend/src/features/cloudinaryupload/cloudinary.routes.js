import express from "express";
import { messageFileUpload } from "./cloudinary.controller.js";
import upload from "../../middlewares/upload.js";

const cloudinaryRouter=express.Router()

cloudinaryRouter
  .route("/messages")
  .post(upload.array("files", 5), messageFileUpload);


export default cloudinaryRouter