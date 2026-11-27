import { io } from "socket.io-client";
import { getToken } from "./utils/session.js";

const socket = io(import.meta.env.VITE_API_URL, {
  autoConnect: false,
  transports: ["websocket"],
  // Read on every (re)connect, so a replaced token (e.g. after a password change) is used
  auth: (cb) => cb({ token: getToken() }),
});

export default socket;
