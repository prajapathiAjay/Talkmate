import express from "express"
import { userRegisteration,userSignIn,getAllUsers,userLogout } from "./user.controller.js"
import { authMiddleware } from "../../middlewares/auth.js"




 

const userRouter=express.Router()

userRouter.route("/signUp").post(userRegisteration)
userRouter.route("/signIn").post(userSignIn)
userRouter.route("/logout").post(authMiddleware, userLogout)
userRouter.route("/allUsers").get(authMiddleware, getAllUsers)






export default userRouter