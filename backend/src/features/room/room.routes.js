import express from "express";
import {
  roomCreation,
  getRoomData,
  roomDatawithseen,
  getUnreadCounts,
  markRoomRead,
  muteRoom,
} from "./room.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const roomRouter = express.Router();

roomRouter.use(authMiddleware);
roomRouter.route("/createRoom").post(roomCreation);
roomRouter.route("/").get(getRoomData);
roomRouter.route("/private").get(roomDatawithseen);
roomRouter.route("/unread").get(getUnreadCounts);
roomRouter.route("/:roomId/read").post(markRoomRead);
roomRouter.route("/:roomId/mute").post(muteRoom);

export default roomRouter;
