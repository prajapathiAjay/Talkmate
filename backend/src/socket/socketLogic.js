import { Server } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.js";
import { handleOnlineUsers, handleOfflineUser } from "../realTime/user.socket.js";
import { createMessageRepository } from "../features/message/message.repository.js";
import { RoomModel } from "../features/room/room.schema.js";

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

    // Typing indicators
    socket.on("typing", ({ name, roomId, userId }) => {
      socket.broadcast.to(roomId).emit("userTyping", { userId, name });
    });

    socket.on("stop-typing", ({ name, roomId, userId }) => {
      socket.broadcast.to(roomId).emit("userStopTyping", { userId, name });
    });

    socket.on("join-room", async ({ roomId, userName, roomType }) => {
      socket.roomId = roomId;
      socket.userName = userName;
      socket.roomType;
      socket.join(roomId);

      try {
        await handleOnlineUsers(socket);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("sendMessage", async ({ message, senderName, attachments, roomId, senderId }, ack) => {
      try {
        const messageData = { roomId, senderId, senderName, message, attachments };
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
        ack?.({
          success: false,
          message: "Failed to send message",
          error: error.message,
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
