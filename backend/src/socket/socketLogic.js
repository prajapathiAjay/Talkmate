import { Server } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.js";
import { handleOnlineUsers, handleOfflineUser } from "../realTime/user.socket.js";
import { createMessageRepository } from "../features/message/message.repository.js";
import { RoomModel } from "../features/room/room.schema.js";
import { canAccessRoomRepo } from "../features/room/room.repository.js";
import { UserModel } from "../features/user/user.schema.js";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_ATTACHMENTS = 5;

// Only keep attachments that came from our own Cloudinary uploads
const cleanAttachments = (attachments) =>
  (Array.isArray(attachments) ? attachments : [])
    .filter((file) => typeof file?.fileUrl === "string" && file.fileUrl.startsWith("https://res.cloudinary.com/"))
    .slice(0, MAX_ATTACHMENTS)
    .map(({ fileUrl, fileName, fileType }) => ({
      fileUrl,
      fileName: String(fileName || "").slice(0, 200),
      fileType: String(fileType || "").slice(0, 100),
    }));

// Personal channel per user, used for unread-message notifications
const userChannel = (userId) => `user:${userId}`;

// Tell everyone who should know about a new message, wherever they are in the app
const notifyNewMessage = async (io, socket, saved) => {
  const room = await RoomModel.findById(saved.roomId).select("type participants");
  if (!room) return;

  const notification = {
    roomId: saved.roomId.toString(),
    roomType: room.type,
    senderId: saved.senderId?.toString(),
    senderName: saved.senderName,
    preview: saved.message?.slice(0, 80) || (saved.attachments?.length ? "📷 Photo" : ""),
  };

  if (room.type === "private") {
    room.participants
      .map((id) => id.toString())
      .filter((id) => id !== notification.senderId)
      .forEach((id) => io.to(userChannel(id)).emit("message-notification", notification));
  } else {
    socket.broadcast.emit("message-notification", notification);
  }
};

export const socketLogic = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [/^http:\/\/(localhost|127\.0\.0\.1):\d+$/, "https://talkmate-ezzq.onrender.com"],
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuth);

  io.on("connection", async (socket) => {
    console.log("socket connected");
    socket.join(userChannel(socket.user.id));

    // Who this socket is, from the database - never trust ids/names sent by the client.
    // Started now (not awaited) so no events are missed while it loads; .exec() makes it
    // a real promise that runs once, and .catch keeps a DB error from crashing the server.
    const me = UserModel.findById(socket.user.id).select("name").lean().exec().catch(() => null);

    // Typing indicators: only into the room this socket is in, under the real name
    const relayTyping = (event) => async ({ roomId } = {}) => {
      if (!roomId || !socket.rooms.has(roomId)) return;
      const user = await me;
      socket.broadcast.to(roomId).emit(event, { userId: socket.user.id, name: user?.name });
    };
    socket.on("typing", relayTyping("userTyping"));
    socket.on("stop-typing", relayTyping("userStopTyping"));

    socket.on("join-room", async ({ roomId } = {}) => {
      // Only the public room or private rooms you're a participant of
      const room = await canAccessRoomRepo(roomId, socket.user.id);
      if (!room) {
        socket.emit("room-error", { roomId, message: "You don't have access to this chat" });
        return;
      }

      // One open chat at a time (unread counts come via the personal channel)
      if (socket.roomId && socket.roomId !== roomId) socket.leave(socket.roomId);

      const user = await me;
      socket.roomId = roomId;
      socket.userName = user?.name;
      socket.roomType = room.type;
      socket.join(roomId);

      try {
        await handleOnlineUsers(socket);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("sendMessage", async ({ message, attachments, roomId } = {}, ack) => {
      try {
        const room = await canAccessRoomRepo(roomId, socket.user.id);
        if (!room) {
          return ack?.({ success: false, message: "You don't have access to this chat" });
        }

        const text = typeof message === "string" ? message.slice(0, MAX_MESSAGE_LENGTH) : "";
        const files = cleanAttachments(attachments);
        if (!text.trim() && files.length === 0) {
          return ack?.({ success: false, message: "Message is empty" });
        }

        // Sender always comes from the login token, never from the client payload
        const user = await me;
        const messageData = {
          roomId,
          senderId: socket.user.id,
          senderName: user?.name,
          message: text,
          attachments: files,
        };
        const messageSaved = await createMessageRepository(messageData);

        io.to(roomId).emit("message", messageSaved);

        if (messageSaved?.success) {
          notifyNewMessage(io, socket, messageSaved.data).catch((error) =>
            console.error("Failed to send message notification:", error)
          );
        }

        if (messageSaved?.success) {
          ack?.({
            messageSaved,
          });
        }
      } catch (error) {
        console.error("sendMessage failed:", error);
        ack?.({
          success: false,
          message: "Failed to send message",
        });
      }
    });

    socket.on("disconnect", async () => {
      try {
        await handleOfflineUser(socket);
      } catch (error) {
        console.error("disconnection problem");
      }
      console.log("socket disconnected");
    });
  });

  return io;
};
