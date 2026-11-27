import { handleOnlineUsersrepo } from "../features/user/user.repository.js";
import { createMessageRepository } from "../features/message/message.repository.js";
import { MessageModel } from "../features/message/message.schema.js";

// Has this user ever had a "joined the chat" notice in this room? Older notices
// were saved without a sender, so those are matched by their text.
const hasJoinedBefore = (roomId, userId, userName) =>
  MessageModel.exists({
    roomId,
    messageType: "join",
    $or: [
      { senderId: userId },
      { senderId: { $exists: false }, message: `${userName} has joined the chat` },
    ],
  });

// userId -> Set of socket ids (one per tab/device)
const onlineUsers = new Map();
const disconnectTimers = new Map();

export const handleOnlineUsers = async (socket) => {
  try {
    const userId = socket?.user?.id;

    if (!userId) {
      console.error("User ID not found on socket");
      return;
    }

    // User reconnected before offline timer completed
    if (disconnectTimers.has(userId)) {
      clearTimeout(disconnectTimers.get(userId));
      disconnectTimers.delete(userId);
    }

    let isFirstConnection = false;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      isFirstConnection = true;
    }

    onlineUsers.get(userId).add(socket.id);

    if (isFirstConnection) {
      const response = await handleOnlineUsersrepo(true, userId);

      // "X joined the chat" only the first time someone joins the public room;
      // coming back online is shown by their green dot, not a new message
      const userName = response.data?.name;
      if (
        response.success &&
        socket.roomType !== "private" &&
        !(await hasJoinedBefore(socket.roomId, userId, userName))
      ) {
        const message = await createMessageRepository({
          roomId: socket.roomId,
          senderId: userId,
          message: `${userName} has joined the chat`,
          messageType: "join",
        });

        if (message.success) {
          // Same room the message was saved in (the public room the user just joined)
          socket.broadcast.to(socket.roomId).emit("message", message);
        }
      }

      socket.broadcast.emit("user-status-changed", response);
    }
  } catch (error) {
    console.error("Error in handleOnlineUsers:", error);
  }
};

export const handleOfflineUser = async (socket) => {
  try {
    const userId = socket.user?.id;

    if (!userId) {
      console.error("User ID not found on socket");
      return;
    }

    if (!onlineUsers.has(userId)) {
      return;
    }

    const userSockets = onlineUsers.get(userId);

    userSockets.delete(socket.id);

    // User still has another tab/device connected
    if (userSockets.size > 0) {
      return;
    }

    // Delay the offline update so quick reconnects don't flicker the status
    const timer = setTimeout(async () => {
      try {
        // User came back before timer ended
        if (onlineUsers.has(userId) && onlineUsers.get(userId).size > 0) {
          disconnectTimers.delete(userId);
          return;
        }

        onlineUsers.delete(userId);

        const response = await handleOnlineUsersrepo(false, userId);

        if (!response.success) {
          disconnectTimers.delete(userId);
          return;
        }

        socket.broadcast.emit("user-status-changed", response);

        disconnectTimers.delete(userId);
      } catch (error) {
        console.error("Offline timer error:", error);
      }
    }, 5000);

    disconnectTimers.set(userId, timer);
  } catch (error) {
    console.error("Error in handleOfflineUser:", error);
  }
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

export const getUserSocketIds = (userId) => {
  return [...(onlineUsers.get(userId) || [])];
};
