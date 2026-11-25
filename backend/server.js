import http from "http";
import app from "./app.js";
import { socketLogic } from "./src/socket/socketLogic.js";
import { connectToDb } from "./src/config/db.js";

const server = http.createServer(app);

socketLogic(server);

const PORT = process.env.PORT || 5000;

connectToDb()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
