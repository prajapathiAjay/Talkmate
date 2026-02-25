import express from "express"
import { userRegisteration,userSignIn,getAllUsers } from "./user.controller.js"






const userRouter=express.Router()

userRouter.route("/signUp").post(userRegisteration)
userRouter.route("/signIn").post(userSignIn)
userRouter.route("/allUsers").get(getAllUsers)






export default userRouter