import express from  "express";
import { addFriend, getFriends } from "./friend.controller.js";

const friendRouter=express.Router();

friendRouter.route("/getFriends").get(getFriends)
friendRouter.route("/add").post(addFriend)


export default friendRouter;