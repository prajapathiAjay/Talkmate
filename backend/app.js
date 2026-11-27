import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./src/features/user/user.routes.js";
import roomRouter from "./src/features/room/room.routes.js";
import friendRouter from "./src/features/friend/friend.routes.js";
import messageRouter from "./src/features/message/message.routes.js";
import cloudinaryRouter from "./src/features/cloudinaryupload/cloudinary.routes.js";
import { appLevelErrorHandlerMiddleware } from "./src/middlewares/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: [/^http:\/\/(localhost|127\.0\.0\.1):\d+$/, "https://talkmate-ezzq.onrender.com"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/messages", messageRouter);
app.use("/api/user", userRouter);
app.use("/api/room", roomRouter);
app.use("/api/upload", cloudinaryRouter);
app.use("/api/friend", friendRouter);
app.use(appLevelErrorHandlerMiddleware);

export default app;
