import { getMessageRepo } from "./message.repository.js";
import { canAccessRoomRepo } from "../room/room.repository.js";
import { customErrorHandler } from "../../middlewares/errorHandler.js";

export const getMessage = async (req, res, next) => {
  try {
    const { roomId } = req.query;

    // Private chats are only readable by their participants
    const room = await canAccessRoomRepo(roomId, req.user.id);
    if (!room) {
      return next(new customErrorHandler(403, "You don't have access to this chat"));
    }

    const messages = await getMessageRepo({ roomId });
    if (messages.success) {
      return res.status(200).json({
        success: messages.success,
        status: messages.status,
        messages: messages.message,
        data: messages.data,
      });
    }

    return next(new customErrorHandler(500, "message fetching failed"));
  } catch (error) {
    return next(new customErrorHandler(500, "message fetching failed"));
  }
};
