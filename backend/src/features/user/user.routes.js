import express from "express";
import {
  userRegisteration,
  userSignIn,
  getAllUsers,
  userLogout,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "./user.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const userRouter = express.Router();

userRouter.route("/signUp").post(userRegisteration);
userRouter.route("/signIn").post(userSignIn);
userRouter.route("/forgot-password").post(forgotPassword);
userRouter.route("/reset-password").post(resetPassword);
userRouter.route("/logout").post(authMiddleware, userLogout);
userRouter.route("/allUsers").get(authMiddleware, getAllUsers);
userRouter.route("/profile").patch(authMiddleware, updateProfile);
userRouter.route("/password").patch(authMiddleware, changePassword);

export default userRouter;
