import { customErrorHandler } from "../../middlewares/errorHandler.js";
import {
  roomCreationRepo,
  getRoomDataRepo,
  roomDatawithseenRepo,
  canAccessRoomRepo,
  getUnreadCountsRepo,
  markRoomReadRepo,
} from "./room.repository.js";

export const roomCreation = async (req, res, next) => {
  try {
    const resp = await roomCreationRepo(req.body);

    if (resp.success) {
      return res.status(201).json({
        successs: true,
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
  const { type, participants } = req.query;
  const participantIds = Array.isArray(participants) ? participants : [participants];

  try {
    const resp = await getRoomDataRepo({ type, participantIds }, req.user.id);

    if (resp.success) {
      return res.status(resp?.status).json({
        success: resp.success,
        message: resp?.message,
        data: resp.data,
      });
    }

    return next(
      new customErrorHandler(
        resp.error?.statusCode,
        resp.error?.message || "Error while fetching the room data"
      )
    );
  } catch (error) {
    new customErrorHandler(
      error?.statusCode || 500,
      error?.message || "Error while fetching the room data"
    );
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
        resp.error?.statusCode,
        resp.error?.message || "Error while fetching the privateroom data"
      )
    );
  } catch (error) {
    new customErrorHandler(
      error?.statusCode || 500,
      error?.message || "Error while fetching the room data"
    );
  }
};

// GET /api/room/unread -> { data: { "<roomId>": count } }
export const getUnreadCounts = async (req, res, next) => {
  try {
    const counts = await getUnreadCountsRepo(req.user.id);
    return res.status(200).json({ success: true, data: counts });
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
