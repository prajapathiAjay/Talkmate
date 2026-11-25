import { Server } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.js";
import { handleOnlineUsers, handleOfflineUser } from "../realTime/user.socket.js";
import { createMessageRepository } from "../features/message/message.repository.js";

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
