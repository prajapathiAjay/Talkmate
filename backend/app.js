import express from "express"
import cors from "cors"
import userRouter from "./src/features/user/user.routes.js"
import roomRouter from "./src/features/room/room.routes.js"
import messageRouter from "./src/features/message/message.routes.js"
import cloudinaryRouter from "./src/features/cloudinaryupload/cloudinary.routes.js"
import { appLevelErrorHandlerMiddleware } from "./src/middlewares/errorHandler.js"
import cookieParser from "cookie-parser"
const app = express()

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

// 👇 VERY IMPORTANT (handles preflight requests)
// app.options("*", cors())
app.use(cookieParser())
app.use(express.json())
app.use("/api/messages",messageRouter)
app.use("/api/user", userRouter)
app.use("/api/room", roomRouter)
app.use("/api/upload", cloudinaryRouter)
app.use(appLevelErrorHandlerMiddleware)




export default app
