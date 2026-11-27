import { customErrorHandler } from "../../middlewares/errorHandler.js";
import {
  createPrivateRoomRepo,
  getRoomDataRepo,
  roomDatawithseenRepo,
  canAccessRoomRepo,
  getUnreadCountsRepo,
  markRoomReadRepo,
} from "./room.repository.js";
import { getMutedRoomsRepo, setRoomMutedRepo } from "../user/user.repository.js";

// POST /api/room/createRoom { friendId } -> private chat with that user
export const roomCreation = async (req, res, next) => {
  try {
    const resp = await createPrivateRoomRepo(req.user.id, req.body?.friendId);

    if (resp.success) {
      return res.status(resp.status).json({
        success: true,
        message: resp?.message,
        data: resp.data,
      });
    }

    return next(
      new customErrorHandler(
        resp.error?.statusCode,
        resp.error?.message
      )
    );
  } catch (error) {
    return next(
      new customErrorHandler(
        error?.statusCode || 500,
        error?.message || "Error while Creating the room"
      )
    );
  }
};

export const getRoomData = async (req, res, next) => {
  const { type } = req.query;

  try {
    const resp = await getRoomDataRepo({ type }, req.user.id);

    if (resp.success) {
      return res.status(resp?.status).json({
        success: resp.success,
        message: resp?.message,
        data: resp.data,
      });
    }

    return next(
      new customErrorHandler(
        resp.error?.statusCode || 500,
        resp.error?.message || "Error while fetching the room data"
      )
    );
  } catch (error) {
    return next(new customErrorHandler(500, "Error while fetching the room data"));
  }
};

export const roomDatawithseen = async (req, res, next) => {
  const { name } = req.query;

  try {
    const response = await roomDatawithseenRepo(name, req?.user?.id);
    if (response?.success) {
      return res.status(response?.status).json({
        success: response?.success,
        status: response?.status,
        message: response?.message,
        data: response?.data,
      });
    }
    return next(
      new customErrorHandler(
        response?.error?.statusCode || 500,
        response?.error?.message || "Error while fetching private chats"
      )
    );
  } catch (error) {
    return next(new customErrorHandler(500, "Error while fetching private chats"));
  }
};

// GET /api/room/unread -> { data: { "<roomId>": count }, muted: ["<roomId>", ...] }
// Muted chats are left out of the counts.
export const getUnreadCounts = async (req, res, next) => {
  try {
    const muted = await getMutedRoomsRepo(req.user.id);
    const counts = await getUnreadCountsRepo(req.user.id, muted);
    return res.status(200).json({ success: true, data: counts, muted });
  } catch (error) {
    return next(new customErrorHandler(500, "Error while counting unread messages"));
  }
};

// POST /api/room/:roomId/read
export const markRoomRead = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const room = await canAccessRoomRepo(roomId, req.user.id);
    if (!room) {
      return next(new customErrorHandler(403, "You don't have access to this chat"));
    }
    await markRoomReadRepo(roomId, req.user.id);
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(new customErrorHandler(500, "Error while marking the chat as read"));
  }
};

// POST /api/room/:roomId/mute { muted: true|false } -> { muted: ["<roomId>", ...] }
export const muteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (typeof req.body?.muted !== "boolean") {
      return next(new customErrorHandler(400, "muted must be true or false"));
    }
    const room = await canAccessRoomRepo(roomId, req.user.id);
    if (!room) {
      return next(new customErrorHandler(403, "You don't have access to this chat"));
    }
    const muted = await setRoomMutedRepo(req.user.id, roomId, req.body.muted);
    return res.status(200).json({ success: true, muted });
  } catch (error) {
    return next(new customErrorHandler(500, "Error while changing notifications for this chat"));
  }
};
