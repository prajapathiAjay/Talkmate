import { Server } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.js";
// message services

import { handleOnlineUsers, handleOfflineUser } from "../realTime/user.socket.js";
import { createMessage } from "../features/message/message.service.js";
export const socketLogic = (server) => {

  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.use(socketAuth);
  io.on("connection", async (socket) => {
    console.log("socket connected")
    try {
      await handleOnlineUsers(socket)
    } catch (error) {
      console.log(error)
    }

    // typing indicator
    // on Typing
    socket.on("typing", ({ name, roomId, userId }) => {
      socket.broadcast.to(roomId).emit("userTyping", { userId, name })
    })

    //  on STop Typing
    socket.on("stop-typing", ({ name, roomId, userId }) => {
      socket.broadcast.to(roomId).emit("userStopTyping", { userId, name })
    })

    socket.on("join-room", async ({ roomId, userName }, ack) => {
      socket.roomId = roomId;
      socket.userName = userName;
      console.log("roomid", roomId, userName)
      socket.join(roomId);
      try {
        const messageData = { roomId, message: `${userName} has joined the Chat`, messageType: "join" }
        const message = await createMessage(messageData)
        console.log("messagessdasdasd", message)

        if (message?.success) {
          ack?.({
            message
          })
        }
      } catch (error) {
        ack?.({
          success: false,
          message: "failed to join room",
          error: error?.message,
        })
      }
      // socket.emit("joinSuccess", { userName });
      // socket.to(roomId).emit("userJoined", message);
    });

    socket.on("sendMessage", async ({ message, senderName, attachments }, ack) => {
      const { roomId, userName } = socket
      try {
        let userId = socket.user.id
        const messageData = { roomId, senderId: userId, senderName, message, attachments }
        const messageSaved = await createMessage(messageData)
        io.to(roomId).emit("message", messageSaved)


        ack?.({
          messageSaved
        })


      } catch (error) {

        ack?.({
          success: false,
          message: "Failed to send message",
          error: error.message
        })
      }

    })

    socket.on("disconnect", async () => {
      try {
        await handleOfflineUser(socket)
      } catch (error) {
        console.error("disconnection problem")
      }
      console.log("socket disconnected");
    });
  });

  return io;
};



