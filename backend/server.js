import http from "http";
import app from "./app.js";
import { socketLogic } from "./src/socket/socketLogic.js";
import { connectToDb } from "./src/config/db.js";
import { ensurePublicRoomRepo } from "./src/features/room/room.repository.js";

const server = http.createServer(app);

socketLogic(server);

const PORT = process.env.PORT || 5000;

connectToDb()
  .then(() => ensurePublicRoomRepo())
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
