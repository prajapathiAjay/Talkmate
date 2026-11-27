import { Server } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.js";
import { handleOnlineUsers, handleOfflineUser } from "../realTime/user.socket.js";
import { createMessageRepository } from "../features/message/message.repository.js";
import { RoomModel } from "../features/room/room.schema.js";
import { canAccessRoomRepo } from "../features/room/room.repository.js";
import { UserModel } from "../features/user/user.schema.js";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_ATTACHMENTS = 3;

// Only keep attachments that came from our own Cloudinary account's uploads
const cleanAttachments = (attachments) => {
  const ownCloudinary = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
  return (Array.isArray(attachments) ? attachments : [])
    .filter((file) => typeof file?.fileUrl === "string" && file.fileUrl.startsWith(ownCloudinary))
    .slice(0, MAX_ATTACHMENTS)
    .map(({ fileUrl, fileName, fileType }) => ({
      fileUrl,
      fileName: String(fileName || "").slice(0, 200),
      fileType: String(fileType || "").slice(0, 100),
    }));
};

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

    // Typing indicators: only into the room this socket is in, under the real name.
    // socket.typingIn remembers the room this user is typing in, so the server can
    // send "stopped typing" itself if they leave that room or disconnect first.
    socket.on("typing", async ({ roomId } = {}) => {
      if (!roomId || !socket.rooms.has(roomId)) return;
      socket.typingIn = roomId;
      const user = await me;
      socket.broadcast.to(roomId).emit("userTyping", { roomId, userId: socket.user.id, name: user?.name });
    });

    const stopTypingIn = (roomId) => {
      if (!roomId) return;
      if (socket.typingIn === roomId) socket.typingIn = null;
      io.to(roomId).except(socket.id).emit("userStopTyping", { roomId, userId: socket.user.id });
    };

    socket.on("stop-typing", ({ roomId } = {}) => {
      // Accepted even after leaving the room, as long as it's the room they were typing in
      if (roomId && (socket.rooms.has(roomId) || socket.typingIn === roomId)) stopTypingIn(roomId);
    });

    socket.on("join-room", async ({ roomId } = {}) => {
      // Only the public room or private rooms you're a participant of
      const room = await canAccessRoomRepo(roomId, socket.user.id);
      if (!room) {
        socket.emit("room-error", { roomId, message: "You don't have access to this chat" });
        return;
      }

      // One open chat at a time (unread counts come via the personal channel)
      if (socket.roomId && socket.roomId !== roomId) {
        // Leaving mid-typing: tell the old room this user stopped
        if (socket.typingIn === socket.roomId) stopTypingIn(socket.roomId);
        socket.leave(socket.roomId);
      }

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

        // Not saved: tell only the sender, so their app can show an error and keep the text
        if (!messageSaved?.success) {
          console.error("sendMessage: saving failed", messageSaved?.error);
          return ack?.({ success: false, message: "Failed to send message" });
        }

        io.to(roomId).emit("message", messageSaved);

        notifyNewMessage(io, socket, messageSaved.data).catch((error) =>
          console.error("Failed to send message notification:", error)
        );

        ack?.({ success: true, messageSaved });
      } catch (error) {
        console.error("sendMessage failed:", error);
        ack?.({
          success: false,
          message: "Failed to send message",
        });
      }
    });

    socket.on("disconnect", async () => {
      // Tab closed or connection lost mid-typing: nobody else will clear it
      if (socket.typingIn) stopTypingIn(socket.typingIn);

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
